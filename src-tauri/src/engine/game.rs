use std::collections::HashSet;

use super::types::*;

pub struct GoGame {
    board: Vec<Vec<Option<StoneColor>>>,
    board_size: u8,
    current_player: StoneColor,
    move_number: u32,
    black_captures: u32,
    white_captures: u32,
    last_move: Option<Point>,
    game_over: bool,
    passes_in_a_row: u8,
    move_history: Vec<MoveRecord>,
    history: Vec<u64>, // Zobrist-like hash for ko detection
}

impl GoGame {
    pub fn new(size: BoardSize) -> Self {
        let s = size.to_u8() as usize;
        GoGame {
            board: vec![vec![None; s]; s],
            board_size: size.to_u8(),
            current_player: StoneColor::Black,
            move_number: 0,
            black_captures: 0,
            white_captures: 0,
            last_move: None,
            game_over: false,
            passes_in_a_row: 0,
            move_history: Vec::new(),
            history: Vec::new(),
        }
    }

    pub fn board_size(&self) -> BoardSize {
        BoardSize::from_u8(self.board_size).unwrap()
    }

    pub fn current_player(&self) -> StoneColor {
        self.current_player
    }

    pub fn move_number(&self) -> u32 {
        self.move_number
    }

    fn neighbors(&self, x: u8, y: u8) -> Vec<(u8, u8)> {
        let mut result = Vec::new();
        let size = self.board_size;
        if x > 0 {
            result.push((x - 1, y));
        }
        if x < size - 1 {
            result.push((x + 1, y));
        }
        if y > 0 {
            result.push((x, y - 1));
        }
        if y < size - 1 {
            result.push((x, y + 1));
        }
        result
    }

    fn get_group(&self, x: u8, y: u8) -> HashSet<(u8, u8)> {
        let color = match self.board[y as usize][x as usize] {
            Some(c) => c,
            None => return HashSet::new(),
        };

        let mut group = HashSet::new();
        let mut stack = vec![(x, y)];

        while let Some((cx, cy)) = stack.pop() {
            if group.contains(&(cx, cy)) {
                continue;
            }
            if self.board[cy as usize][cx as usize] != Some(color) {
                continue;
            }
            group.insert((cx, cy));

            for (nx, ny) in self.neighbors(cx, cy) {
                if !group.contains(&(nx, ny)) {
                    stack.push((nx, ny));
                }
            }
        }

        group
    }

    fn count_liberties(&self, group: &HashSet<(u8, u8)>) -> usize {
        let mut liberties = HashSet::new();

        for &(x, y) in group {
            for (nx, ny) in self.neighbors(x, y) {
                if self.board[ny as usize][nx as usize].is_none() {
                    liberties.insert((nx, ny));
                }
            }
        }

        liberties.len()
    }

    fn find_captures(&self, x: u8, y: u8, color: StoneColor) -> Vec<(u8, u8)> {
        let mut captured = Vec::new();
        let opponent = color.opposite();

        for (nx, ny) in self.neighbors(x, y) {
            if self.board[ny as usize][nx as usize] == Some(opponent) {
                let group = self.get_group(nx, ny);
                if self.count_liberties(&group) == 0 {
                    captured.extend(group);
                }
            }
        }

        captured
    }

    fn compute_board_hash(&self) -> u64 {
        let mut hash = 0u64;
        for y in 0..self.board_size as usize {
            for x in 0..self.board_size as usize {
                if let Some(color) = self.board[y][x] {
                    let val = match color {
                        StoneColor::Black => 1u64,
                        StoneColor::White => 2u64,
                    };
                    hash ^= val.wrapping_mul((x as u64 + 1) * 31 + (y as u64 + 1) * 37);
                }
            }
        }
        hash ^= (self.current_player as u64) << 56;
        hash
    }

    pub fn place_stone(&mut self, x: u8, y: u8) -> Result<MoveResult, String> {
        if self.game_over {
            return Err("Game is already over".to_string());
        }

        let size = self.board_size;
        if x >= size || y >= size {
            return Err("Move out of bounds".to_string());
        }

        if self.board[y as usize][x as usize].is_some() {
            return Err("Point already occupied".to_string());
        }

        let color = self.current_player;

        // Temporarily place the stone
        self.board[y as usize][x as usize] = Some(color);

        // Check for captures
        let captured = self.find_captures(x, y, color);

        // Check if the placed stone's group has liberties
        let group = self.get_group(x, y);
        let has_liberties = self.count_liberties(&group) > 0;

        // Check for ko
        let new_hash = self.compute_board_hash();
        let is_ko = captured.len() == 1 && self.history.contains(&new_hash);

        // Remove the stone temporarily to check validity
        self.board[y as usize][x as usize] = None;

        if !has_liberties && captured.is_empty() {
            return Err("Suicide move: stone would have no liberties".to_string());
        }

        if is_ko {
            return Err("Ko rule violation".to_string());
        }

        // Valid move - apply it
        self.board[y as usize][x as usize] = Some(color);

        // Remove captured stones
        let mut captured_points = Vec::new();
        for (cx, cy) in &captured {
            self.board[*cy as usize][*cx as usize] = None;
            captured_points.push(Point { x: *cx, y: *cy });
        }

        // Update captures count
        match color {
            StoneColor::Black => self.black_captures += captured.len() as u32,
            StoneColor::White => self.white_captures += captured.len() as u32,
        }

        // Record history
        self.history.push(new_hash);

        // Record move to move_history
        self.move_history.push(MoveRecord {
            move_type: MoveType::Stone,
            x: Some(x),
            y: Some(y),
            captured_stones: captured_points.clone(),
            player: color,
            board_snapshot: self.board.clone(),
            black_captures: self.black_captures,
            white_captures: self.white_captures,
        });

        // Update state
        self.move_number += 1;
        self.passes_in_a_row = 0;
        self.last_move = Some(Point { x, y });
        self.current_player = self.current_player.opposite();

        Ok(MoveResult {
            success: true,
            captured_stones: captured_points,
            error: None,
            game_over: false,
            winner: None,
            score: None,
        })
    }

    pub fn pass(&mut self) -> MoveResult {
        let player_passing = self.current_player;
        self.passes_in_a_row += 1;
        self.move_number += 1;
        self.current_player = self.current_player.opposite();

        let game_over = self.passes_in_a_row >= 2;

        self.move_history.push(MoveRecord {
            move_type: MoveType::Pass,
            x: None,
            y: None,
            captured_stones: vec![],
            player: player_passing,
            board_snapshot: self.board.clone(),
            black_captures: self.black_captures,
            white_captures: self.white_captures,
        });

        if game_over {
            self.game_over = true;
            let (winner, score) = self.compute_score();
            return MoveResult {
                success: true,
                captured_stones: vec![],
                error: None,
                game_over: true,
                winner: Some(winner),
                score: Some(score),
            };
        }

        MoveResult {
            success: true,
            captured_stones: vec![],
            error: None,
            game_over: false,
            winner: None,
            score: None,
        }
    }

    pub fn undo(&mut self) -> Result<(), String> {
        if self.move_history.is_empty() {
            return Err("No moves to undo".to_string());
        }

        let last_move_record = self.move_history.pop().unwrap();

        self.board = last_move_record.board_snapshot;
        self.black_captures = last_move_record.black_captures;
        self.white_captures = last_move_record.white_captures;
        self.move_number -= 1;

        match last_move_record.move_type {
            MoveType::Pass => {
                self.passes_in_a_row = self.passes_in_a_row.saturating_sub(1);
                self.current_player = last_move_record.player;
                self.game_over = false;
            }
            MoveType::Resign => {
                self.current_player = last_move_record.player;
                self.game_over = false;
            }
            MoveType::Stone => {
                self.passes_in_a_row = 0;
                self.current_player = last_move_record.player;
                if let Some(point) = self
                    .move_history
                    .iter()
                    .rev()
                    .find(|m| matches!(m.move_type, MoveType::Stone))
                {
                    self.last_move = if let MoveType::Stone = point.move_type {
                        if let (Some(x), Some(y)) = (point.x, point.y) {
                            Some(Point { x, y })
                        } else {
                            None
                        }
                    } else {
                        None
                    };
                } else {
                    self.last_move = None;
                }
            }
        }

        Ok(())
    }

    pub fn undo_multiple(&mut self, count: u8) -> Result<(), String> {
        for _ in 0..count {
            self.undo()?;
        }
        Ok(())
    }

    pub fn get_move_history(&self) -> Vec<MoveRecord> {
        self.move_history.clone()
    }

    pub fn resign(&mut self, player: StoneColor) -> MoveResult {
        self.game_over = true;
        let winner = player.opposite();

        self.move_history.push(MoveRecord {
            move_type: MoveType::Resign,
            x: None,
            y: None,
            captured_stones: vec![],
            player,
            board_snapshot: self.board.clone(),
            black_captures: self.black_captures,
            white_captures: self.white_captures,
        });

        MoveResult {
            success: true,
            captured_stones: vec![],
            error: None,
            game_over: true,
            winner: Some(winner),
            score: None,
        }
    }

    pub fn get_board_state(&self) -> Vec<Vec<Option<StoneColor>>> {
        self.board.clone()
    }

    pub fn get_game_state(&self) -> GameState {
        GameState {
            board_size: self.board_size,
            current_player: self.current_player,
            board: self.get_board_state(),
            move_number: self.move_number,
            black_captures: self.black_captures,
            white_captures: self.white_captures,
            last_move: self.last_move.clone(),
            game_over: self.game_over,
            passes_in_a_row: self.passes_in_a_row,
        }
    }

    pub fn is_valid_move(&self, x: u8, y: u8) -> bool {
        if self.game_over {
            return false;
        }
        let size = self.board_size;
        if x >= size || y >= size {
            return false;
        }
        if self.board[y as usize][x as usize].is_some() {
            return false;
        }

        let color = self.current_player;

        // Check suicide
        let mut test_board = self.board.clone();
        test_board[y as usize][x as usize] = Some(color);

        // Check if this captures opponent stones
        let mut captures_opponent = false;
        for (nx, ny) in self.neighbors(x, y) {
            if test_board[ny as usize][nx as usize] == Some(color.opposite()) {
                let mut group = HashSet::new();
                let mut stack = vec![(nx, ny)];
                while let Some((cx, cy)) = stack.pop() {
                    if group.contains(&(cx, cy)) {
                        continue;
                    }
                    if test_board[cy as usize][cx as usize] != Some(color.opposite()) {
                        continue;
                    }
                    group.insert((cx, cy));
                    for (nnx, nny) in self.neighbors(cx, cy) {
                        if !group.contains(&(nnx, nny)) {
                            stack.push((nnx, nny));
                        }
                    }
                }

                let mut liberties = HashSet::new();
                for &(gx, gy) in &group {
                    for (lnx, lny) in self.neighbors(gx, gy) {
                        if test_board[lny as usize][lnx as usize].is_none() {
                            liberties.insert((lnx, lny));
                        }
                    }
                }

                if liberties.is_empty() {
                    captures_opponent = true;
                    break;
                }
            }
        }

        // Check own group liberties
        let mut own_group = HashSet::new();
        let mut stack = vec![(x, y)];
        while let Some((cx, cy)) = stack.pop() {
            if own_group.contains(&(cx, cy)) {
                continue;
            }
            if test_board[cy as usize][cx as usize] != Some(color) {
                continue;
            }
            own_group.insert((cx, cy));
            for (nx, ny) in self.neighbors(cx, cy) {
                if !own_group.contains(&(nx, ny)) {
                    stack.push((nx, ny));
                }
            }
        }

        let mut own_liberties = HashSet::new();
        for &(gx, gy) in &own_group {
            for (nx, ny) in self.neighbors(gx, gy) {
                if test_board[ny as usize][nx as usize].is_none() {
                    own_liberties.insert((nx, ny));
                }
            }
        }

        if own_liberties.is_empty() && !captures_opponent {
            return false; // Suicide
        }

        // Ko check
        let mut temp_game = self.clone_game();
        temp_game.board[y as usize][x as usize] = Some(color);
        let hash = temp_game.compute_board_hash();
        if self.history.contains(&hash) {
            return false; // Ko
        }

        true
    }

    pub fn get_valid_moves(&self) -> Vec<Point> {
        let size = self.board_size;
        let mut moves = Vec::new();

        for y in 0..size {
            for x in 0..size {
                if self.is_valid_move(x, y) {
                    moves.push(Point { x, y });
                }
            }
        }

        moves
    }

    pub fn get_captures(&self) -> (u32, u32) {
        (self.black_captures, self.white_captures)
    }

    pub fn compute_score(&self) -> (StoneColor, ScoreResult) {
        let komi = 6.5f32;
        let (black_territory, white_territory) = self.count_territory();

        let black_total = black_territory as f32 + self.black_captures as f32;
        let white_total = white_territory as f32 + self.white_captures as f32 + komi;

        let winner = if black_total > white_total {
            StoneColor::Black
        } else {
            StoneColor::White
        };

        let margin = (black_total - white_total).abs();

        (
            winner,
            ScoreResult {
                black_territory,
                white_territory,
                black_captures: self.black_captures,
                white_captures: self.white_captures,
                komi,
                black_total,
                white_total,
                winner,
                margin,
            },
        )
    }

    fn count_territory(&self) -> (u32, u32) {
        let size = self.board_size as usize;
        let mut black_territory = 0u32;
        let mut white_territory = 0u32;
        let mut visited = vec![vec![false; size]; size];

        for y in 0..size {
            for x in 0..size {
                if visited[y][x] || self.board[y][x].is_some() {
                    continue;
                }

                let mut region = Vec::new();
                let mut border_colors = HashSet::new();
                let mut stack = vec![(x, y)];

                while let Some((cx, cy)) = stack.pop() {
                    if visited[cy][cx] {
                        continue;
                    }
                    visited[cy][cx] = true;

                    if let Some(color) = self.board[cy][cx] {
                        border_colors.insert(color);
                        continue;
                    }

                    region.push((cx, cy));

                    for (dx, dy) in &[(0i32, 1i32), (0, -1), (1, 0), (-1, 0)] {
                        let nx = cx as i32 + dx;
                        let ny = cy as i32 + dy;
                        if nx >= 0 && nx < size as i32 && ny >= 0 && ny < size as i32 {
                            if !visited[ny as usize][nx as usize] {
                                stack.push((nx as usize, ny as usize));
                            }
                        }
                    }
                }

                if border_colors.len() == 1 {
                    let owner = border_colors.iter().next().unwrap();
                    match owner {
                        StoneColor::Black => black_territory += region.len() as u32,
                        StoneColor::White => white_territory += region.len() as u32,
                    }
                }
            }
        }

        (black_territory, white_territory)
    }

    pub fn clone_game(&self) -> Self {
        GoGame {
            board: self.board.clone(),
            board_size: self.board_size,
            current_player: self.current_player,
            move_number: self.move_number,
            black_captures: self.black_captures,
            white_captures: self.white_captures,
            last_move: self.last_move.clone(),
            game_over: self.game_over,
            passes_in_a_row: self.passes_in_a_row,
            move_history: self.move_history.clone(),
            history: self.history.clone(),
        }
    }

    pub fn clone_for_simulation(&self) -> Self {
        GoGame {
            board: self.board.clone(),
            board_size: self.board_size,
            current_player: self.current_player,
            move_number: self.move_number,
            black_captures: self.black_captures,
            white_captures: self.white_captures,
            last_move: None,
            game_over: false,
            passes_in_a_row: self.passes_in_a_row,
            move_history: Vec::new(),
            history: Vec::new(),
        }
    }

    pub fn place_stone_fast(&mut self, x: u8, y: u8) -> bool {
        if self.game_over {
            return false;
        }
        let size = self.board_size;
        if x >= size || y >= size {
            return false;
        }
        if self.board[y as usize][x as usize].is_some() {
            return false;
        }

        let color = self.current_player;
        self.board[y as usize][x as usize] = Some(color);

        let captured = self.find_captures(x, y, color);
        let group = self.get_group(x, y);
        let has_liberties = self.count_liberties(&group) > 0;

        if !has_liberties && captured.is_empty() {
            self.board[y as usize][x as usize] = None;
            return false;
        }

        match color {
            StoneColor::Black => self.black_captures += captured.len() as u32,
            StoneColor::White => self.white_captures += captured.len() as u32,
        }

        for (cx, cy) in &captured {
            self.board[*cy as usize][*cx as usize] = None;
        }

        self.move_number += 1;
        self.passes_in_a_row = 0;
        self.current_player = self.current_player.opposite();
        true
    }

    pub fn pass_fast(&mut self) {
        self.passes_in_a_row += 1;
        self.move_number += 1;
        self.current_player = self.current_player.opposite();
    }

    pub fn is_game_over_fast(&self) -> bool {
        self.passes_in_a_row >= 2
    }

    pub fn would_capture_count(&self, x: u8, y: u8) -> usize {
        let color = self.current_player;
        if self.board[y as usize][x as usize].is_some() {
            return 0;
        }

        let mut test_board = self.board.clone();
        test_board[y as usize][x as usize] = Some(color);

        let mut total_captured = 0;
        let opponent = color.opposite();
        let mut checked_groups: HashSet<(u8, u8)> = HashSet::new();

        for (nx, ny) in self.neighbors(x, y) {
            if test_board[ny as usize][nx as usize] == Some(opponent)
                && !checked_groups.contains(&(nx, ny))
            {
                let mut group = HashSet::new();
                let mut stack = vec![(nx, ny)];
                while let Some((cx, cy)) = stack.pop() {
                    if group.contains(&(cx, cy)) {
                        continue;
                    }
                    if test_board[cy as usize][cx as usize] != Some(opponent) {
                        continue;
                    }
                    group.insert((cx, cy));
                    checked_groups.insert((cx, cy));
                    for (nnx, nny) in self.neighbors(cx, cy) {
                        if !group.contains(&(nnx, nny)) {
                            stack.push((nnx, nny));
                        }
                    }
                }

                let mut liberties = 0u8;
                let mut liberty_set = HashSet::new();
                for &(gx, gy) in &group {
                    for (lnx, lny) in self.neighbors(gx, gy) {
                        if test_board[lny as usize][lnx as usize].is_none()
                            && liberty_set.insert((lnx, lny))
                        {
                            liberties += 1;
                        }
                    }
                }

                if liberties == 0 {
                    total_captured += group.len();
                    for &(gx, gy) in &group {
                        test_board[gy as usize][gx as usize] = None;
                    }
                }
            }
        }

        total_captured
    }

    pub fn creates_atari(&self, x: u8, y: u8) -> bool {
        let color = self.current_player;
        if self.board[y as usize][x as usize].is_some() {
            return false;
        }

        let mut test_board = self.board.clone();
        test_board[y as usize][x as usize] = Some(color);

        let opponent = color.opposite();
        let mut checked: HashSet<(u8, u8)> = HashSet::new();

        for (nx, ny) in self.neighbors(x, y) {
            if test_board[ny as usize][nx as usize] == Some(opponent)
                && !checked.contains(&(nx, ny))
            {
                let mut group = HashSet::new();
                let mut stack = vec![(nx, ny)];
                while let Some((cx, cy)) = stack.pop() {
                    if group.contains(&(cx, cy)) {
                        continue;
                    }
                    if test_board[cy as usize][cx as usize] != Some(opponent) {
                        continue;
                    }
                    group.insert((cx, cy));
                    checked.insert((cx, cy));
                    for (nnx, nny) in self.neighbors(cx, cy) {
                        if !group.contains(&(nnx, nny)) {
                            stack.push((nnx, nny));
                        }
                    }
                }

                let mut liberties = 0u8;
                let mut liberty_set = HashSet::new();
                for &(gx, gy) in &group {
                    for (lnx, lny) in self.neighbors(gx, gy) {
                        if test_board[lny as usize][lnx as usize].is_none()
                            && liberty_set.insert((lnx, lny))
                        {
                            liberties += 1;
                            if liberties >= 2 {
                                break;
                            }
                        }
                    }
                    if liberties >= 2 {
                        break;
                    }
                }

                if liberties == 1 && group.len() >= 2 {
                    return true;
                }
            }
        }

        false
    }

    pub fn is_self_atari(&self, x: u8, y: u8) -> bool {
        let color = self.current_player;
        if self.board[y as usize][x as usize].is_some() {
            return false;
        }

        let mut test_board = self.board.clone();
        test_board[y as usize][x as usize] = Some(color);

        for (nx, ny) in self.neighbors(x, y) {
            if test_board[ny as usize][nx as usize] == Some(color.opposite()) {
                let mut group = HashSet::new();
                let mut stack = vec![(nx, ny)];
                while let Some((cx, cy)) = stack.pop() {
                    if group.contains(&(cx, cy)) {
                        continue;
                    }
                    if test_board[cy as usize][cx as usize] != Some(color.opposite()) {
                        continue;
                    }
                    group.insert((cx, cy));
                    for (nnx, nny) in self.neighbors(cx, cy) {
                        if !group.contains(&(nnx, nny)) {
                            stack.push((nnx, nny));
                        }
                    }
                }

                let has_liberty = group.iter().any(|&(gx, gy)| {
                    self.neighbors(gx, gy)
                        .iter()
                        .any(|&(lnx, lny)| test_board[lny as usize][lnx as usize].is_none())
                });

                if !has_liberty {
                    for &(gx, gy) in &group {
                        test_board[gy as usize][gx as usize] = None;
                    }
                }
            }
        }

        let mut own_group = HashSet::new();
        let mut stack = vec![(x, y)];
        while let Some((cx, cy)) = stack.pop() {
            if own_group.contains(&(cx, cy)) {
                continue;
            }
            if test_board[cy as usize][cx as usize] != Some(color) {
                continue;
            }
            own_group.insert((cx, cy));
            for (nx, ny) in self.neighbors(cx, cy) {
                if !own_group.contains(&(nx, ny)) {
                    stack.push((nx, ny));
                }
            }
        }

        let mut liberties = 0u8;
        let mut liberty_set = HashSet::new();
        for &(gx, gy) in &own_group {
            for (lnx, lny) in self.neighbors(gx, gy) {
                if test_board[lny as usize][lnx as usize].is_none()
                    && liberty_set.insert((lnx, lny))
                {
                    liberties += 1;
                    if liberties >= 2 {
                        return false;
                    }
                }
            }
        }

        own_group.len() > 1 && liberties == 1
    }

    pub fn get_group_liberties_at(&self, x: u8, y: u8) -> usize {
        if self.board[y as usize][x as usize].is_none() {
            return 0;
        }
        let group = self.get_group(x, y);
        if group.is_empty() {
            return 0;
        }
        self.count_liberties(&group)
    }

    pub fn connects_friendly_groups(&self, x: u8, y: u8) -> usize {
        let color = self.current_player;
        if self.board[y as usize][x as usize].is_some() {
            return 0;
        }

        let mut groups: HashSet<(u8, u8)> = HashSet::new();
        for (nx, ny) in self.neighbors(x, y) {
            if self.board[ny as usize][nx as usize] == Some(color) && !groups.contains(&(nx, ny)) {
                let group = self.get_group(nx, ny);
                for &pt in &group {
                    groups.insert(pt);
                }
            }
        }

        groups.len()
    }
}

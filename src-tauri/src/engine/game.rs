use std::collections::HashSet;

use super::board_utils;
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
    history: Vec<u64>,
    zobrist: ZobristTable,
    current_hash: u64,
    komi: f32,
}

impl GoGame {
    pub fn new(size: BoardSize, komi: f32) -> Self {
        let s = size.to_u8() as usize;
        let zobrist = ZobristTable::new();
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
            zobrist,
            current_hash: 0,
            komi,
        }
    }

    pub fn from_board_state(size: BoardSize, stones: &[(u8, u8, StoneColor)], komi: f32) -> Self {
        let mut game = GoGame::new(size, komi);
        for &(x, y, color) in stones {
            if (x as usize) < game.board_size as usize && (y as usize) < game.board_size as usize {
                game.board[y as usize][x as usize] = Some(color);
            }
        }
        game
    }

    pub fn from_position(
        size: BoardSize,
        stones: &[(u8, u8, StoneColor)],
        current_player: StoneColor,
        komi: f32,
        black_captures: u32,
        white_captures: u32,
    ) -> Self {
        let mut game = GoGame::from_board_state(size, stones, komi);
        game.current_player = current_player;
        game.black_captures = black_captures;
        game.white_captures = white_captures;
        game.current_hash = game.compute_hash();
        game
    }

    pub fn set_current_player(&mut self, player: StoneColor) {
        self.current_player = player;
        self.current_hash = self.compute_hash();
    }

    pub fn set_captures(&mut self, black: u32, white: u32) {
        self.black_captures = black;
        self.white_captures = white;
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

    pub fn komi(&self) -> f32 {
        self.komi
    }

    pub fn board_hash(&self) -> u64 {
        self.current_hash
    }

    fn neighbors_iter(&self, x: u8, y: u8) -> impl Iterator<Item = (u8, u8)> {
        board_utils::neighbors(x, y, self.board_size).into_iter()
    }

    fn get_group(&self, x: u8, y: u8) -> HashSet<(u8, u8)> {
        board_utils::get_group(&self.board, x, y, self.board_size)
    }

    fn count_liberties(&self, group: &HashSet<(u8, u8)>) -> usize {
        board_utils::count_liberties(&self.board, group, self.board_size)
    }

    fn find_captures(&self, x: u8, y: u8, color: StoneColor) -> Vec<(u8, u8)> {
        let mut captured = Vec::new();
        let opponent = color.opposite();

        for (nx, ny) in self.neighbors_iter(x, y) {
            if self.board[ny as usize][nx as usize] == Some(opponent) {
                let group = self.get_group(nx, ny);
                if self.count_liberties(&group) == 0 {
                    captured.extend(group);
                }
            }
        }

        captured
    }

    fn compute_hash(&self) -> u64 {
        let mut hash = 0u64;
        for y in 0..self.board_size as usize {
            for x in 0..self.board_size as usize {
                if let Some(color) = self.board[y][x] {
                    match color {
                        StoneColor::Black => hash ^= self.zobrist.black[y][x],
                        StoneColor::White => hash ^= self.zobrist.white[y][x],
                    }
                }
            }
        }
        if self.current_player == StoneColor::White {
            hash ^= self.zobrist.player;
        }
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

        // Remove the stone temporarily to check validity
        self.board[y as usize][x as usize] = None;

        if !has_liberties && captured.is_empty() {
            return Err("Suicide move: stone would have no liberties".to_string());
        }

        // Compute hash for positional superko
        let mut new_hash = self.current_hash;
        match color {
            StoneColor::Black => new_hash ^= self.zobrist.black[y as usize][x as usize],
            StoneColor::White => new_hash ^= self.zobrist.white[y as usize][x as usize],
        }
        for &(cx, cy) in &captured {
            let cap_color = color.opposite();
            match cap_color {
                StoneColor::Black => new_hash ^= self.zobrist.black[cy as usize][cx as usize],
                StoneColor::White => new_hash ^= self.zobrist.white[cy as usize][cx as usize],
            }
        }
        new_hash ^= self.zobrist.player;

        // Positional superko
        if self.history.contains(&new_hash) {
            return Err("Ko rule violation".to_string());
        }

        // Valid move - apply it
        self.board[y as usize][x as usize] = Some(color);
        self.current_hash = new_hash;

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
        self.current_hash ^= self.zobrist.player;

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

        // Recompute hash from board state
        self.current_hash = self.compute_hash();

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

        // Remove last history entry
        self.history.pop();

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
            komi: self.komi,
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
        let opponent = color.opposite();

        // Check if this captures any opponent group
        let mut captures_opponent = false;
        for (nx, ny) in self.neighbors_iter(x, y) {
            if self.board[ny as usize][nx as usize] == Some(opponent) {
                // Check if that opponent group would have zero liberties after placing our stone
                let group = self.get_group(nx, ny);
                let mut has_liberty = false;
                for &(gx, gy) in &group {
                    for (lnx, lny) in self.neighbors_iter(gx, gy) {
                        if self.board[lny as usize][lnx as usize].is_none()
                            && (lnx != x || lny != y)
                        {
                            has_liberty = true;
                            break;
                        }
                    }
                    if has_liberty {
                        break;
                    }
                }
                if !has_liberty {
                    captures_opponent = true;
                    break;
                }
            }
        }

        if captures_opponent {
            // Check positional superko
            let mut new_hash = self.current_hash;
            match color {
                StoneColor::Black => new_hash ^= self.zobrist.black[y as usize][x as usize],
                StoneColor::White => new_hash ^= self.zobrist.white[y as usize][x as usize],
            }
            // XOR out captured stones
            for (nx, ny) in self.neighbors_iter(x, y) {
                if self.board[ny as usize][nx as usize] == Some(opponent) {
                    let group = self.get_group(nx, ny);
                    let mut has_ext_liberty = false;
                    for &(gx, gy) in &group {
                        for (lnx, lny) in self.neighbors_iter(gx, gy) {
                            if self.board[lny as usize][lnx as usize].is_none()
                                && (lnx != x || lny != y)
                            {
                                has_ext_liberty = true;
                                break;
                            }
                        }
                        if has_ext_liberty {
                            break;
                        }
                    }
                    if !has_ext_liberty {
                        for &(gx, gy) in &group {
                            match opponent {
                                StoneColor::Black => {
                                    new_hash ^= self.zobrist.black[gy as usize][gx as usize]
                                }
                                StoneColor::White => {
                                    new_hash ^= self.zobrist.white[gy as usize][gx as usize]
                                }
                            }
                        }
                    }
                }
            }
            new_hash ^= self.zobrist.player;
            if self.history.contains(&new_hash) {
                return false;
            }
            return true;
        }

        // No captures — check suicide: does our own group have liberties?
        // Temporarily check by looking at neighbors of (x,y)
        let mut own_has_liberty = false;
        for (nx, ny) in self.neighbors_iter(x, y) {
            if self.board[ny as usize][nx as usize].is_none() {
                own_has_liberty = true;
                break;
            }
            if self.board[ny as usize][nx as usize] == Some(color) {
                // Check if friendly group has liberties beyond (x,y)
                let group = self.get_group(nx, ny);
                for &(gx, gy) in &group {
                    for (lnx, lny) in self.neighbors_iter(gx, gy) {
                        if self.board[lny as usize][lnx as usize].is_none()
                            && (lnx != x || lny != y)
                        {
                            own_has_liberty = true;
                            break;
                        }
                    }
                    if own_has_liberty {
                        break;
                    }
                }
            }
            if own_has_liberty {
                break;
            }
        }

        if !own_has_liberty {
            return false; // Suicide
        }

        // Check positional superko
        let mut new_hash = self.current_hash;
        match color {
            StoneColor::Black => new_hash ^= self.zobrist.black[y as usize][x as usize],
            StoneColor::White => new_hash ^= self.zobrist.white[y as usize][x as usize],
        }
        new_hash ^= self.zobrist.player;
        if self.history.contains(&new_hash) {
            return false;
        }

        true
    }

    pub fn get_valid_moves(&self) -> Vec<Point> {
        let size = self.board_size;
        let mut moves = Vec::with_capacity((size as usize) * (size as usize));

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
        let (black_territory, white_territory) = self.count_territory();

        let black_total = black_territory as f32 + self.black_captures as f32;
        let white_total = white_territory as f32 + self.white_captures as f32 + self.komi;

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
                komi: self.komi,
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

        // Detect seki regions to exclude from scoring
        let seki_points: HashSet<(usize, usize)> = self
            .detect_seki_regions()
            .into_iter()
            .map(|(x, y)| (x as usize, y as usize))
            .collect();

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
                        if nx >= 0
                            && nx < size as i32
                            && ny >= 0
                            && ny < size as i32
                            && !visited[ny as usize][nx as usize]
                        {
                            stack.push((nx as usize, ny as usize));
                        }
                    }
                }

                if border_colors.len() == 1 {
                    let owner = border_colors.iter().next().unwrap();
                    // Exclude seki points from territory
                    let non_seki_count =
                        region.iter().filter(|pt| !seki_points.contains(pt)).count() as u32;
                    match owner {
                        StoneColor::Black => black_territory += non_seki_count,
                        StoneColor::White => white_territory += non_seki_count,
                    }
                }
            }
        }

        (black_territory, white_territory)
    }

    pub fn detect_seki_regions(&self) -> Vec<(u8, u8)> {
        let size = self.board_size as usize;
        let mut seki_points = Vec::new();
        let mut visited_empty = vec![vec![false; size]; size];

        for y in 0..size {
            for x in 0..size {
                if visited_empty[y][x] || self.board[y][x].is_some() {
                    continue;
                }

                // Flood-fill this empty region
                let mut region = Vec::new();
                let mut border_groups: Vec<HashSet<(usize, usize)>> = Vec::new();
                let mut visited_group = vec![vec![false; size]; size];
                let mut stack = vec![(x, y)];
                let mut region_visited = vec![vec![false; size]; size];

                while let Some((cx, cy)) = stack.pop() {
                    if region_visited[cy][cx] {
                        continue;
                    }
                    region_visited[cy][cx] = true;
                    visited_empty[cy][cx] = true;

                    if self.board[cy][cx].is_some() {
                        continue;
                    }
                    region.push((cx, cy));

                    for (dx, dy) in &[(0i32, 1i32), (0, -1), (1, 0), (-1, 0)] {
                        let nx = cx as i32 + dx;
                        let ny = cy as i32 + dy;
                        if nx >= 0 && nx < size as i32 && ny >= 0 && ny < size as i32 {
                            let (ux, uy) = (nx as usize, ny as usize);
                            if !region_visited[uy][ux] {
                                stack.push((ux, uy));
                            }
                            // Track border groups
                            if let Some(color) = self.board[uy][ux] {
                                if !visited_group[uy][ux] {
                                    // Flood fill this group
                                    let mut group = HashSet::new();
                                    let mut gstack = vec![(ux, uy)];
                                    while let Some((gx, gy)) = gstack.pop() {
                                        if group.contains(&(gx, gy)) {
                                            continue;
                                        }
                                        if self.board[gy][gx] != Some(color) {
                                            continue;
                                        }
                                        group.insert((gx, gy));
                                        visited_group[gy][gx] = true;
                                        for (gdx, gdy) in &[(0i32, 1i32), (0, -1), (1, 0), (-1, 0)]
                                        {
                                            let gnx = gx as i32 + gdx;
                                            let gny = gy as i32 + gdy;
                                            if gnx >= 0
                                                && gnx < size as i32
                                                && gny >= 0
                                                && gny < size as i32
                                            {
                                                let (gnux, gnuy) = (gnx as usize, gny as usize);
                                                if !group.contains(&(gnux, gnuy)) {
                                                    gstack.push((gnux, gnuy));
                                                }
                                            }
                                        }
                                    }
                                    border_groups.push(group);
                                }
                            }
                        }
                    }
                }

                if region.is_empty() {
                    continue;
                }

                // Seki condition: 2+ groups share this empty region AND
                // all groups have ALL their liberties in this region (no outside liberties)
                if border_groups.len() < 2 {
                    continue;
                }

                let region_set: HashSet<(usize, usize)> = region.iter().copied().collect();
                let mut all_groups_trapped = true;

                for group in &border_groups {
                    let mut group_has_outside_liberty = false;
                    for &(gx, gy) in group {
                        for (dx, dy) in &[(0i32, 1i32), (0, -1), (1, 0), (-1, 0)] {
                            let nx = gx as i32 + dx;
                            let ny = gy as i32 + dy;
                            if nx >= 0 && nx < size as i32 && ny >= 0 && ny < size as i32 {
                                let (ux, uy) = (nx as usize, ny as usize);
                                if self.board[uy][ux].is_none() && !region_set.contains(&(ux, uy)) {
                                    group_has_outside_liberty = true;
                                    break;
                                }
                            }
                        }
                        if group_has_outside_liberty {
                            break;
                        }
                    }
                    if group_has_outside_liberty {
                        all_groups_trapped = false;
                        break;
                    }
                }

                if all_groups_trapped {
                    for (rx, ry) in &region {
                        seki_points.push((*rx as u8, *ry as u8));
                    }
                }
            }
        }

        seki_points
    }

    pub fn estimate_dead_stones(&self) -> Vec<(u8, u8, StoneColor)> {
        let size = self.board_size;
        let mut dead = Vec::new();
        let mut visited = vec![vec![false; size as usize]; size as usize];

        for y in 0..size {
            for x in 0..size {
                if visited[y as usize][x as usize] {
                    continue;
                }
                if let Some(color) = self.board[y as usize][x as usize] {
                    let group = self.get_group(x, y);
                    for &(gx, gy) in &group {
                        visited[gy as usize][gx as usize] = true;
                    }

                    let liberties = self.count_liberties(&group);
                    if liberties <= 2 {
                        // Check if liberties are surrounded by opponent
                        let mut lib_positions = HashSet::new();
                        for &(gx, gy) in &group {
                            for (nx, ny) in self.neighbors_iter(gx, gy) {
                                if self.board[ny as usize][nx as usize].is_none() {
                                    lib_positions.insert((nx, ny));
                                }
                            }
                        }

                        let mut dominated = true;
                        for &(lx, ly) in &lib_positions {
                            let mut surrounded_by_opponent = true;
                            for (nx, ny) in self.neighbors_iter(lx, ly) {
                                if let Some(stone) = self.board[ny as usize][nx as usize] {
                                    if stone != color.opposite() {
                                        surrounded_by_opponent = false;
                                        break;
                                    }
                                } else {
                                    surrounded_by_opponent = false;
                                    break;
                                }
                            }
                            if !surrounded_by_opponent {
                                dominated = false;
                                break;
                            }
                        }

                        if dominated {
                            for &(gx, gy) in &group {
                                dead.push((gx, gy, color));
                            }
                        }
                    }
                }
            }
        }

        dead
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
            zobrist: self.zobrist.clone(),
            current_hash: self.current_hash,
            komi: self.komi,
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
            zobrist: self.zobrist.clone(),
            current_hash: self.current_hash,
            komi: self.komi,
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

        // Incremental hash update
        match color {
            StoneColor::Black => self.current_hash ^= self.zobrist.black[y as usize][x as usize],
            StoneColor::White => self.current_hash ^= self.zobrist.white[y as usize][x as usize],
        }
        for &(cx, cy) in &captured {
            let cap_color = color.opposite();
            match cap_color {
                StoneColor::Black => {
                    self.current_hash ^= self.zobrist.black[cy as usize][cx as usize]
                }
                StoneColor::White => {
                    self.current_hash ^= self.zobrist.white[cy as usize][cx as usize]
                }
            }
        }
        self.current_hash ^= self.zobrist.player;

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
        self.current_hash ^= self.zobrist.player;
    }

    pub fn is_game_over_fast(&self) -> bool {
        self.passes_in_a_row >= 2
    }

    pub fn would_capture_count(&self, x: u8, y: u8) -> usize {
        let color = self.current_player;
        if self.board[y as usize][x as usize].is_some() {
            return 0;
        }

        // Use a test board
        let mut test_board = self.board.clone();
        test_board[y as usize][x as usize] = Some(color);

        let mut total_captured = 0;
        let opponent = color.opposite();
        let mut checked_groups: HashSet<(u8, u8)> = HashSet::new();

        for (nx, ny) in self.neighbors_iter(x, y) {
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
                    for (nnx, nny) in self.neighbors_iter(cx, cy) {
                        if !group.contains(&(nnx, nny)) {
                            stack.push((nnx, nny));
                        }
                    }
                }

                let mut has_liberty = false;
                for &(gx, gy) in &group {
                    for (lnx, lny) in self.neighbors_iter(gx, gy) {
                        if test_board[lny as usize][lnx as usize].is_none() {
                            has_liberty = true;
                            break;
                        }
                    }
                    if has_liberty {
                        break;
                    }
                }

                if !has_liberty {
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

        // Use a test board
        let mut test_board = self.board.clone();
        test_board[y as usize][x as usize] = Some(color);

        let opponent = color.opposite();
        let mut checked: HashSet<(u8, u8)> = HashSet::new();

        for (nx, ny) in self.neighbors_iter(x, y) {
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
                    for (nnx, nny) in self.neighbors_iter(cx, cy) {
                        if !group.contains(&(nnx, nny)) {
                            stack.push((nnx, nny));
                        }
                    }
                }

                let mut liberties = 0u8;
                let mut liberty_set = HashSet::new();
                for &(gx, gy) in &group {
                    for (lnx, lny) in self.neighbors_iter(gx, gy) {
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

        // Use a test board since we need to simulate captures
        let mut test_board = self.board.clone();
        test_board[y as usize][x as usize] = Some(color);

        // Check if any opponent groups adjacent would be captured
        let opponent = color.opposite();
        for (nx, ny) in self.neighbors_iter(x, y) {
            if test_board[ny as usize][nx as usize] == Some(opponent) {
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
                    for (nnx, nny) in self.neighbors_iter(cx, cy) {
                        if !group.contains(&(nnx, nny)) {
                            stack.push((nnx, nny));
                        }
                    }
                }

                let has_liberty = group.iter().any(|&(gx, gy)| {
                    self.neighbors_iter(gx, gy)
                        .any(|(lnx, lny)| test_board[lny as usize][lnx as usize].is_none())
                });

                if !has_liberty {
                    for &(gx, gy) in &group {
                        test_board[gy as usize][gx as usize] = None;
                    }
                }
            }
        }

        // Count own group liberties
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
            for (nx, ny) in self.neighbors_iter(cx, cy) {
                if !own_group.contains(&(nx, ny)) {
                    stack.push((nx, ny));
                }
            }
        }

        let mut liberties = 0u8;
        let mut liberty_set = HashSet::new();
        for &(gx, gy) in &own_group {
            for (lnx, lny) in self.neighbors_iter(gx, gy) {
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
        for (nx, ny) in self.neighbors_iter(x, y) {
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

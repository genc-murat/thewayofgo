# Engine Fixes, AI Improvements & Code Cleanup Plan

## Özet

Go motoru, AI ve kod temizliği alanlarında 25 değişiklik: Zobrist hashing + positional superko, seki tespiti, ölü taş tahmini, yapılandırılabilir komi, MCTS ağaç yeniden kullanımı, RAVE/AMAF, performans optimizasyonları,ölü bağımlılık kaldırma,ölü kod temizliği, paylaşılan utils ve sabit değer düzeltmeleri.

## Uygulama Sırası

### Aşama 1: Hızlı Temizlik (düşük risk, yüksek değer)

#### 1. Ölü bağımlılıkları kaldır — `src-tauri/Cargo.toml`

`goban`, `specta`, `tauri-specta` satırlarını sil. `exercise_commands.rs`'deki `#[specta::specta]` attribute'larını kaldır (satır 74, 116).

#### 2. Ölü kodu sil — `src-tauri/src/db/progress.rs`

Tüm dosyayı sil. `src-tauri/src/db/mod.rs` içeriğini boşalt. `src-tauri/src/lib.rs`'den `pub mod db;` satırını kaldır (eğer db/ boşsa).

#### 3. `@tanstack/react-query` bağımlılığını kaldır — `package.json`

Kullanılmıyor. `src/main.tsx`'den `QueryClientProvider` import ve wrapper'ını kaldır.

#### 4. Paylaşılan utility oluştur — `src/utils/boardUtils.ts`

`createBoardFromStones` fonksiyonunu 3 dosyadan (appStore.ts, ExerciseView.tsx, LessonViewer.tsx) çıkar, tek bir `src/utils/boardUtils.ts` dosyasına taşı. Tüm importları güncelle.

#### 5. `canAdvanceLevel(1)` sabit değeri düzelt — `src/components/Progress/ProgressPage.tsx:32`

`useAppStore`'dan `currentLevel` al ve `canAdvanceLevel(currentLevel)` olarak değiştir.

#### 6. AIDifficulty simülasyon tablosu tekrarını kaldır — `src-tauri/src/engine/types.rs`

`new()` ve `new_with_style()`'daki duplicated match bloğunu ortak bir `simulations_for_level(level)` metoduna çıkar.

---

### Aşama 2: Motor Düzeltmeleri

#### 7. Zobrist Hashing — `src-tauri/src/engine/game.rs`

**Değişiklikler:**

a) **Yeni struct:** `ZobristTable` — `[[u64; 19]; 19]` x 2 (siyah/beyaz) + `player: u64`. Rastgele değerlerle initialize edilir.

b) **`GoGame` struct'ına** şu alanları ekle:
- `zobrist: ZobristTable` (veya referans/Arc)
- `current_hash: u64` (artımlı hash takibi)

c) **`compute_board_hash` (satır 125-140) yerine:** Zobrist tablosu kullanan yeni hash. Her intersection için `zobrist.black[y][x]` veya `zobrist.white[y][x]` XOR'lanır. Oyuncu değişimi için `zobrist.player` XOR'lanır.

d) **Artımlı hash güncellemesi:** `place_stone` ve `place_stone_fast`'te:
- Yeni taşın Zobrist değerini XOR'la
- Yakalanan taşların Zobrist değerlerini XOR'la
- Oyuncu toggle'ını XOR'la
- `self.history`'ye ekle

e) **Klonlama fonksiyonları:** `clone_game()` ve `clone_for_simulation()`'da `current_hash`'i kopyala.

#### 8. Positional Superko — `src-tauri/src/engine/game.rs`

**Mevcut (satır 170):**
```rust
let is_ko = captured.len() == 1 && self.history.contains(&new_hash);
```

**Yeni:**
```rust
let is_superko = self.history.contains(&new_hash);
```

`captured.len() == 1` guard'ını kaldır. Tüm önceki pozisyonları kontrol et (pozisyonel superko).

**Not:** `place_stone_fast` ko kontrolü atlıyor — MCTS playout'ları için bu kabul edilebilir (hız > doğruluk).

#### 9. Seki Tespiti — `src-tauri/src/engine/game.rs`

**Yeni metod: `detect_seki_regions(&self) -> Vec<(u8, u8)>`**

Algoritma:
1. Boş bölgeleri flood-fill ile bul
2. Her boş bölgenin sınırlarındaki taş gruplarını belirle
3. Seki koşulu: 2+ grup bu bölgeyi paylaşıyor VE tüm grupların TÜM özgürlükleri bu bölgede (dış özgürlük yok)
4. Seki noktalarını döndür

**`count_territory`'yi güncelle (satır 522-573):** Seki bölgelerini hariç tut — seki noktaları hiçbir tarafın bölgesi olarak sayılmaz.

#### 10. Ölü Taş Tahmini — `src-tauri/src/engine/game.rs`

**Yeni metod: `estimate_dead_stones(&self) -> Vec<(u8, u8, StoneColor)>`**

Basitleştirilmiş Benson algoritması:
1. Her grubu bul
2. 2 veya daha az özgürlüğü varsa ve bu özgürlükler rakip tarafından kuşatılmışsa → ölü
3. Ölü taş listesini döndür

**`pass` metodunu güncelle (satır 249-260):** İki pas sonrası `estimate_dead_stones()` çağır, skor hesaplamadan önce ölü taşları geçici olarak kaldır (puanlama için), sonra geri koy (görsel tutarlılık için).

#### 11. Yapılandırılabilir Komi — `src-tauri/src/engine/game.rs` + `types.rs` + `game_commands.rs`

**types.rs:** `GameState` struct'ına `komi: f32` ekle.

**game.rs:**
- `GoGame` struct'ına `komi: f32` ekle
- `new(size, komi)` — imzayı değiştir, varsayılan 6.5
- `compute_score` (satır 492): `self.komi` kullan (hardcoded 6.5 yerine)
- `get_game_state`: komi'yi döndür
- `clone_game`, `clone_for_simulation`: komi'yi kopyala

**game_commands.rs:**
- `create_game` komutuna `komi: Option<f32>` parametresi ekle
- `GoGame::new(size, komi.unwrap_or(6.5))` çağır

**Frontend (`types/index.ts`):** `GameState`'e `komi: number` ekle.

**Frontend (`appStore.ts`):** `createGame`'e opsiyonel komi parametresi ekle, `startAiGame`'den geçir.

---

### Aşama 3: AI İyileştirmeleri

#### 12. MCTS Ağaç Yeniden Kullanımı — `src-tauri/src/ai/mcts.rs`

**`MCTSAi` struct'ına ekle:** `root: Option<MCTSNode>` (kalıcı ağaç)

**`MCTSNode`'a ekle:** `board_hash: u64` (pozisyon eşleştirmesi için)

**`get_move` değişikliği:**
1. `&mut self` al (önceki `&self` yerine)
2. MCTS öncesi: mevcut oyun hash'ini al
3. Eski root'un çocuklarında eşleşen pozisyonu ara
4. Eşleşen çocuk yeni root olur → ağaç yeniden kullanılır

**`mcts_search` sonrası:** En çok ziyaret edilen çocuğu yeni root olarak sakla.

**`mcts_search` değişikliği:** `&mut self` al, mevcut root çocuklarını kullan (yoksa sıfırdan oluştur).

#### 13. RAVE/AMAF — `src-tauri/src/ai/mcts.rs`

**`MCTSNode`'a ekle:**
- `rave_visits: u32`
- `rave_wins: f64`

**Yeni metod: `rave_uct_value(parent_visits, beta)`**
- `exploit = (1-β) * q + β * q_rave`
- `β = sqrt(k / (3*visits + k))` — k=2000

**Playout sonrası:** Oynanan hamleleri topla, root çocuklarının RAVE istatistiklerini güncelle.

**`best_child_uct`:** RAVE-aware seçim kullan.

#### 14. Performans: Gereksiz Klonlamaları Azalt — `src-tauri/src/engine/game.rs`

**Hedef fonksiyonlar ve değişiklikler:**

| Fonksiyon | Sorun | Çözüm |
|-----------|-------|-------|
| `is_valid_move` (satır 390) | Her çağrıda `self.board.clone()` | Yerinde doğrulama — test_board oluşturmadan, sadece geçici olarak taşı yerleştir/kaldır |
| `is_valid_move` (satır 462) | `self.clone_game()` (ko kontrolü için) | Zobrist hash tabanlı ko kontrolü — klonlama gerekmez |
| `get_group` (satır 67) | Her çağrıda HashSet + Vec | `visited: &mut Vec<Vec<bool>>` parametresi ile tekrar kullanılabilir visited dizisi |
| `would_capture_count` (satır 662) | `self.board.clone()` | Taşı yerleştir, yakalamaları say, geri al (3 satırda) |
| `creates_atari` (satır 721) | `self.board.clone()` | Aynı geçici yerleştirme yaklaşımı |
| `is_self_atari` (satır 782) | `self.board.clone()` | Aynı geçici yerleştirme yaklaşımı |
| `place_stone_fast` (satır 622-624) | 3 ayrı traversal | Tek traversal: grup bul + özgürlük say + rakip yakalama kontrolü |

**`is_valid_move` yeniden yazımı (en kritik):**
1. Taş zaten var mı → false
2. Komşu rakip gruplarını kontrol et: her birinin `(x,y)` dışında özgürlüğü var mı?
3. Hiç rakip yakalanmıyorsa: kendi grubumuzun özgürlüğü olacak mı? → yoksa false (intihar)
4. Zobrist hash ile ko kontrolü (klonlama yok)

#### 15. `get_valid_moves` Optimizasyonu — `src-tauri/src/engine/game.rs`

Mevcut: `is_valid_move`'i 361 kez çağır (19x19).

Optimizasyon: Tek geçişte tüm boş noktaları kontrol et, grup bilgisini paylaş. Geçerli hamleleri döndür.

**Not:** `get_valid_moves_fast` (MCTS tarafında) için de aynı optimizasyon uygulanmalı.

#### 16. Zobrist Hash ile `place_stone` Entegrasyonu — `src-tauri/src/engine/game.rs`

`place_stone` ve `place_stone_fast`'te:
- Taş yerleştirildiğinde → `current_hash ^= zobrist[color][y][x]`
- Taş yakalandığında → `current_hash ^= zobrist[captured_color][cy][cx]` (her yakalanan taş için)
- Oyuncu değişimi → `current_hash ^= zobrist.player`
- `self.history.push(current_hash)` — her hamleden sonra

#### 17. `neighbors()` Optimizasyonu — `src-tauri/src/engine/game.rs`

Mevcut: `Vec<(u8, u8)>` döndürüyor (heap allocation).

Optimizasyon: Sabit boyutlu array döndür: `[(u8, u8); 4]` (eksik komşular için `None` ile veya küçük array). Veya inline iterasyon (fonksiyon çağrısı yerine döngü içinde doğrudan komşu hesapla).

---

### Aşama 4: Entegrasyon & Frontend Güncelleme

#### 18. Frontend Komi Desteği — `src/types/index.ts` + `src/stores/appStore.ts` + `src/components/Game/GamePlay.tsx`

**types/index.ts:** `GameState`'e `komi: number` ekle.

**appStore.ts:** `createGame`'e `komi?: number` parametresi ekle.

**GamePlay.tsx:** Yeni oyun kurulum ekranına komi seçici ekle (5.5 / 6.5 / 7.5).

#### 19. Frontend — `ScoreDisplay` Komi Güncellemesi — `src/components/Game/GamePlay.tsx`

Komi değeri artık `game.komi`'den gelecek (hardcoded 6.5 yerine).

#### 20. `GameState` Tür Güncellemesi — `src/types/index.ts`

`komi` alanı eklendiğinde, `ScoreDisplay` bileşeni ve store'daki tüm referanslar uyumlu olmalı.

---

## Dosya Değişiklik Özeti

| Dosya | Değişiklik | Aşama |
|-------|-----------|-------|
| `src-tauri/Cargo.toml` | goban, specta, tauri-specta kaldır | 1 |
| `src-tauri/src/db/progress.rs` | Sil | 1 |
| `src-tauri/src/db/mod.rs` | Boşalt | 1 |
| `src-tauri/src/lib.rs` | `pub mod db;` kaldır | 1 |
| `src-tauri/src/commands/exercise_commands.rs` | `#[specta::specta]` kaldır | 1 |
| `src-tauri/src/engine/types.rs` | ZobristTable, GameState komi, AIDifficulty dedupe | 2 |
| `src-tauri/src/engine/game.rs` | Zobrist, superko, seki, dead stones, komi, perf optimize | 2, 3 |
| `src-tauri/src/ai/mcts.rs` | Tree reuse, RAVE, &mut self, perf | 3 |
| `src-tauri/src/commands/game_commands.rs` | create_game komi param | 2, 4 |
| `src/stores/appStore.ts` | createBoardFromStones kaldır, createGame komi | 1, 4 |
| `src/components/Exercise/ExerciseView.tsx` | createBoardFromStones import güncelle | 1 |
| `src/components/Lesson/LessonViewer.tsx` | createBoardFromStones import güncelle | 1 |
| `src/components/Progress/ProgressPage.tsx` | canAdvanceLevel sabit değer düzelt | 1 |
| `src/components/Game/GamePlay.tsx` | Komi seçici, ScoreDisplay komi | 4 |
| `src/types/index.ts` | GameState komi alanı | 4 |
| `src/utils/boardUtils.ts` | Yeni dosya — createBoardFromStones | 1 |
| `src/main.tsx` | QueryClientProvider kaldır | 1 |
| `package.json` | @tanstack/react-query kaldır | 1 |

## Doğrulama

- `cargo build` — her aşama sonrası
- `cargo clippy` — lint temizliği
- `cargo test` — motor testleri (varsa)
- `npm run build` — frontend derleme
- Elle test: AI ile 9x9/19x19 oyun, tüm stiller, farklı komi değerleri
- Superko testi: triple ko pozisyonu oluştur (sonsuz döngü olmamalı)
- Seki testi: bilinen seki pozisyonu (skor doğru olmalı)

## Risk Değerlendirmesi

| Değişiklik | Risk | Açıklama |
|-----------|------|----------|
| Zobrist hashing | Orta | Yeni hash mekanizması, ko algılama davranışını değiştirir |
| Positional superko | Düşük | Sadece guard kaldırılır, mekanizma zaten var |
| Seki tespiti | Yüksek | Go'da seki karmaşık, edge case'ler olabilir |
| Ölü taş tahmini | Yüksek | Benson algoritması basitleştirilmiş, %100 doğru değil |
| Tree reuse | Orta | Eşleşme hataları yanlış ağaç kullanılmasına neden olabilir |
| RAVE | Orta | Matematiksel olarak sağlam ama tuning gerektirir |
| Performans optimize | Düşük | Davranış değişikliği yok, sadece hız |
| Temizlik | Çok düşük | Risk yok |

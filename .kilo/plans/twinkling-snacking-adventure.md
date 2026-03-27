# Plan: Alıştırma Sayısını Artırma ve Pekiştirme Alıştırmaları

## Context
Mevcut EXERCISE_CATALOG sadece 29 alıştırma içeriyor (Seviye 1-2). Diskte 200 alıştırma dosyası var (Seviye 1-6) ama kataloğa eklenmemiş. Kullanıcı alıştırma sayısını artırmak, öğrenme seviyesini yükseltecek pekiştirme alıştırmaları eklemek istiyor.

## Adımlar

### 1. Kırık alıştırma dosyalarını düzelt (8 dosya)

Aşağıdaki dosyalarda `is_correct: false` sorunu veya çok kısa açıklama var:

- `e3-1-2.json` - is_correct: false olan tek correct_move düzeltilecek
- `e3-5-1.json` - is_correct: false olan tek correct_move düzeltilecek
- `e3-5-4.json` - is_correct: false + çelişkili açıklama düzeltilecek
- `e5-4-5.json` - Başlıkta boşluk (" Yan Alana...") düzeltilecek
- `e3-2-5.json`, `e3-2-6.json`, `e3-2-7.json` - Kısa açıklamalar genişletilecek
- `e3-4-5.json`, `e3-4-6.json` - Kısa açıklamalar genişletilecek

### 2. EXERCISE_CATALOG'u genişlet (~29 → ~95 alıştırma)

ExerciseView.tsx'deki EXERCISE_CATALOG dizisine mevcut kaliteli alıştırmaları ekle:

**Seviye 3 (Orta) - ~20 alıştırma ekle:**
- M1 (Açılış): e3-1-3, e3-1-4, e3-1-5, e3-1-6
- M2 (Orta Oyun): e3-2-1, e3-2-2, e3-2-3, e3-2-4
- M3 (Bitiriş): e3-3-1, e3-3-2, e3-3-3, e3-3-4, e3-3-5, e3-3-6
- M4 (Tesuji): e3-4-1, e3-4-2, e3-4-3, e3-4-4
- M5 (Saldırı/Savunma): e3-5-2, e3-5-3, e3-5-5, e3-5-6, e3-5-7
- M6: e3-6-1, e3-6-2, e3-6-3, e3-6-4

**Seviye 4 (İleri) - ~18 alıştırma ekle:**
- M1 (Joseki): e4-1-2, e4-1-3, e4-1-4, e4-1-5
- M2 (Etki Alanları): e4-2-1, e4-2-2, e4-2-3
- M3 (Kalınlaştırma): e4-3-1, e4-3-2, e4-3-3
- M4 (İstila): e4-4-1, e4-4-2, e4-4-3, e4-4-4
- M5 (Sentez): e4-5-1, e4-5-2, e4-5-3, e4-5-4, e4-5-5, e4-5-6

**Seviye 5 (Uzman) - ~14 alıştırma ekle:**
- M1 (İleri Okuma): e5-1-2, e5-1-3, e5-1-4, e5-1-5
- M2 (Sabırlı Oyun): e5-2-1, e5-2-2, e5-2-3, e5-2-4, e5-2-5
- M3 (Denge): e5-3-1, e5-3-2, e5-3-3
- M4 (Karmaşık): e5-4-1, e5-4-2

**Seviye 6 (Usta) - ~14 alıştırma ekle:**
- M1 (Pro Analiz): e6-1-1, e6-1-2, e6-1-3
- M2 (AI Stratejileri): e6-2-1, e6-2-2, e6-2-3, e6-2-4, e6-2-5
- M3 (Turnuva): e6-3-1, e6-3-2, e6-3-3
- M4 (Mentörlük): e6-4-1, e6-4-2, e6-4-3

### 3. Yeni pekiştirme alıştırmaları oluştur (~15 dosya)

Öğrenme seviyesini artıran, kavramları birleştiren yeni alıştırmalar:

**Seviye 1-2 pekiştirmesi (5 dosya):**
- `e1-r-1.json`: Özgürlük + Yakalama birleşimi
- `e1-r-2.json`: Göz kavramı + Grup savunma
- `e2-r-1.json`: Merdiven + Kesme birleşimi
- `e2-r-2.json`: Yaşam/Ölüm + Alan kontrolü
- `e2-r-3.json`: Snapback + Tsumego

**Seviye 3-4 pekiştirmesi (5 dosya):**
- `e3-r-1.json`: Açılış + Orta oyun geçişi
- `e3-r-2.json`: Tesuji + Saldırı/Savunma
- `e4-r-1.json`: Joseki + Etki alanı birleşimi
- `e4-r-2.json`: İstila + Yaşam/Ölüm
- `e4-r-3.json`: Sentez - çoklu kavram

**Seviye 5-6 pekiştirmesi (5 dosya):**
- `e5-r-1.json`: İleri okuma + Karmaşık dövüş
- `e5-r-2.json`: Denge + Sabırlı oyun
- `e6-r-1.json`: Pro analiz + AI stratejisi
- `e6-r-2.json`: Turnuva + Mentörlük sentezi
- `e6-r-3.json`: Tüm seviyelerin sentezi (final pekiştirme)

### 4. ExerciseView.tsx UI güncellemeleri

- Seviye filtre butonlarını 6'ya çıkar (şu an `[1, 2, 3, 4]`)
- TYPE_COLORS'a yeni türler ekle (tesuji, reading_comprehension vb.)
- Pekiştirme alıştırmaları için "Pekiştirme" türü ekle

### 5. Doğrulama

- `npm run build` ile derleme kontrolü
- Tüm alıştırma dosyalarının geçerli JSON olduğunu kontrol etme
- Katalogdaki ID'lerin dosya isimleriyle eşleştiğini doğrulama

## Dosya değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `src/components/Exercise/ExerciseView.tsx` | Katalog genişlet, UI güncelle |
| `src/data/exercises/e3-1-2.json` | is_correct düzelt |
| `src/data/exercises/e3-5-1.json` | is_correct düzelt |
| `src/data/exercises/e3-5-4.json` | is_correct + açıklama düzelt |
| `src/data/exercises/e5-4-5.json` | Başlık boşluk düzelt |
| `src/data/exercises/e3-2-5.json` | Açıklama genişlet |
| `src/data/exercises/e3-2-6.json` | Açıklama genişlet |
| `src/data/exercises/e3-2-7.json` | Açıklama genişlet |
| `src/data/exercises/e3-4-5.json` | Açıklama genişlet |
| `src/data/exercises/e3-4-6.json` | Açıklama genişlet |
| `src/data/exercises/e{X}-r-{Y}.json` (15 yeni) | Yeni pekiştirme alıştırmaları |

## Hedef sonuç
- 29 → ~110 alıştırma (katalog)
- 6 seviyenin tamamını kapsıyor
- Pekiştirme alıştırmaları ile kavram pekiştirme
- Kırık alıştırmalar düzeltildi

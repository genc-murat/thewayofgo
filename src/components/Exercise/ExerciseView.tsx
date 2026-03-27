import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import type { BoardSize, StoneColor, Highlight } from '../../types';

const EXERCISE_CATALOG = [
  { id: 'e1-1-1', level: 1, module: 1, title: 'İlk Hamle', type: 'Doğru Hamle', difficulty: 1 },
  { id: 'e1-1-2', level: 1, module: 1, title: 'Özgürlük Sayısı', type: 'Doğru Hamle', difficulty: 1 },
  { id: 'e1-1-3', level: 1, module: 1, title: 'Taşı Yakala', type: 'Taş Yakalama', difficulty: 1 },
  { id: 'e1-1-4', level: 1, module: 1, title: 'Yasak Hamleyi Bul', type: 'Doğru Hamle', difficulty: 1 },
  { id: 'e1-1-5', level: 1, module: 1, title: 'Ko Durumu', type: 'Taş Yakalama', difficulty: 1 },
  { id: 'e1-1-6', level: 1, module: 1, title: 'Ko Tehditi', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e1-1-7', level: 1, module: 1, title: 'Ko Yakalama', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e1-1-8', level: 1, module: 1, title: 'Çoklu Yakalama', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e1-2-1', level: 1, module: 2, title: 'Grubu Güçlendir', type: 'Doğru Hamle', difficulty: 1 },
  { id: 'e1-2-2', level: 1, module: 2, title: 'İki Göz Yap', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e1-2-3', level: 1, module: 2, title: 'Grubu Yaşatın', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e1-2-4', level: 1, module: 2, title: 'Sahte Gözü Tanıyın', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e1-2-6', level: 1, module: 2, title: 'Çift Göz Yaşatma', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e1-2-7', level: 1, module: 2, title: 'Sahte Göz Tanı', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e1-2-8', level: 1, module: 2, title: 'Grubu Güçlendir', type: 'Grup Savunma', difficulty: 2 },
  { id: 'e1-3-1', level: 1, module: 3, title: 'Açılış Stratejisi', type: 'Açılış', difficulty: 1 },
  { id: 'e1-3-2', level: 1, module: 3, title: 'Alanı Belirleyin', type: 'Alan Kontrolü', difficulty: 1 },
  { id: 'e1-3-3', level: 1, module: 3, title: 'Açılış Hamlesi', type: 'Açılış', difficulty: 1 },
  { id: 'e1-3-4', level: 1, module: 3, title: 'Köşe Kontrolü', type: 'Açılış', difficulty: 1 },
  { id: 'e1-3-5', level: 1, module: 3, title: 'Kenar Geliştirme', type: 'Alan Kontrolü', difficulty: 2 },
  { id: 'e1-3-6', level: 1, module: 3, title: 'Merkez Açılışı', type: 'Açılış', difficulty: 2 },
  { id: 'e1-4-1', level: 1, module: 4, title: 'İleri Ko Kavramı', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e1-4-2', level: 1, module: 4, title: 'Ko Çıkış', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e1-4-3', level: 1, module: 4, title: 'Skor Hesaplama 1', type: 'Alan Kontrolü', difficulty: 2 },
  { id: 'e1-4-4', level: 1, module: 4, title: 'Skor Hesaplama 2', type: 'Alan Kontrolü', difficulty: 3 },
  { id: 'e1-4-5', level: 1, module: 4, title: 'Çoklu Adım', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e1-4-6', level: 1, module: 4, title: 'Ko Kombinasyon', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e1-5-1', level: 1, module: 5, title: 'Bağlantı Tekrarı 2', type: 'Grup Bağlama', difficulty: 2 },
  { id: 'e1-5-2', level: 1, module: 5, title: 'Kesme Tekrarı 2', type: 'Grup Kesme', difficulty: 2 },
  { id: 'e1-5-3', level: 1, module: 5, title: 'Özgürlük Sayma 2', type: 'Taş Yakalama', difficulty: 1 },
  { id: 'e1-5-4', level: 1, module: 5, title: 'Grup Tanıma 2', type: 'Yaşam ve Ölüm', difficulty: 1 },
  { id: 'e1-r-1', level: 1, module: 6, title: 'Özgürlük ve Yakalama', type: 'Taş Yakalama', difficulty: 2 },
  { id: 'e1-r-2', level: 1, module: 6, title: 'Göz ve Grup Savunma', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e2-1-1', level: 2, module: 1, title: 'Merdiveni Başlat', type: 'Taş Yakalama', difficulty: 2 },
  { id: 'e2-1-2', level: 2, module: 1, title: 'Merdiven Kırıcıyı Kullan', type: 'Doğru Hamle', difficulty: 3 },
  { id: 'e2-1-3', level: 2, module: 1, title: 'Ağ Atın', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e2-1-4', level: 2, module: 1, title: 'Snepbek Yapın', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e2-1-5', level: 2, module: 1, title: 'Grubu Yakalayın', type: 'Taş Yakalama', difficulty: 2 },
  { id: 'e2-1-6', level: 2, module: 1, title: 'Merdiven Tahmini', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e2-1-7', level: 2, module: 1, title: 'Merdiven Kırıcı 2', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e2-1-8', level: 2, module: 1, title: 'Merdiven Farklı', type: 'Taş Yakalama', difficulty: 2 },
  { id: 'e2-2-1', level: 2, module: 2, title: 'Kaplan Ağzı Yapın', type: 'Grup Bağlama', difficulty: 2 },
  { id: 'e2-2-2', level: 2, module: 2, title: 'Beyaz Grubu Kesin', type: 'Grup Kesme', difficulty: 3 },
  { id: 'e2-2-3', level: 2, module: 2, title: 'Köprü Kurun', type: 'Grup Bağlama', difficulty: 3 },
  { id: 'e2-2-4', level: 2, module: 2, title: 'Bağlantıyı Koruyun', type: 'Grup Savunma', difficulty: 3 },
  { id: 'e2-3-1', level: 2, module: 3, title: 'Bent Three Yaşatın', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e2-3-2', level: 2, module: 3, title: 'Grubu Yaşatın', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e2-3-3', level: 2, module: 3, title: 'Beyaz Grubu Öldürün', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e2-3-4', level: 2, module: 3, title: 'Ölüm Şeklini Tanıyın', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e2-3-5', level: 2, module: 3, title: 'İleri Yaşatma', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e2-3-6', level: 2, module: 3, title: 'İleri Öldürme', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e2-3-7', level: 2, module: 3, title: 'Ko Yaşatma', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e2-3-8', level: 2, module: 3, title: 'Bent Four Derinlemesi', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e2-4-1', level: 2, module: 4, title: 'Büyük Yose Oynayın', type: 'Bitiriş', difficulty: 2 },
  { id: 'e2-4-2', level: 2, module: 4, title: 'Doğru Sırayı Bulun', type: 'Bitiriş', difficulty: 3 },
  { id: 'e2-4-3', level: 2, module: 4, title: 'Hane Hesaplayın', type: 'Alan Kontrolü', difficulty: 3 },
  { id: 'e2-4-4', level: 2, module: 4, title: 'Skor Tahmini Yapın', type: 'Alan Kontrolü', difficulty: 2 },
  { id: 'e2-4-5', level: 2, module: 4, title: 'Çoklu Yose', type: 'Bitiriş', difficulty: 3 },
  { id: 'e2-4-6', level: 2, module: 4, title: 'Yose Sırası', type: 'Bitiriş', difficulty: 3 },
  { id: 'e2-5-1', level: 2, module: 5, title: 'Merdiven Uygulama', type: 'Taş Yakalama', difficulty: 2 },
  { id: 'e2-5-2', level: 2, module: 5, title: 'Köprü Uygulama', type: 'Grup Bağlama', difficulty: 2 },
  { id: 'e2-5-3', level: 2, module: 5, title: 'İki Göz Uygulama', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e2-5-4', level: 2, module: 5, title: 'Geta Uygulama', type: 'Taş Yakalama', difficulty: 2 },
  { id: 'e2-5-5', level: 2, module: 5, title: 'Kesme+Yaşama', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e2-5-6', level: 2, module: 5, title: 'Ko+Yakalama', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e2-5-7', level: 2, module: 5, title: 'Bağlantı+Savunma', type: 'Grup Savunma', difficulty: 3 },
  { id: 'e2-5-8', level: 2, module: 5, title: 'Geta+Ko', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e2-6-1', level: 2, module: 6, title: 'İki Adımlı Yakalama', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e2-6-2', level: 2, module: 6, title: 'İki Adımlı Yaşama', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e2-6-3', level: 2, module: 6, title: 'Üç Adımlı', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e2-6-4', level: 2, module: 6, title: 'Çoklu Ko', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e2-r-1', level: 2, module: 7, title: 'Merdiven ve Kesme Birleşimi', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e2-r-2', level: 2, module: 7, title: 'Yaşam ve Alan Kontrolü', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e2-r-3', level: 2, module: 7, title: 'Snapback ve Tsumego', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e3-1-1', level: 3, module: 1, title: 'Bent Four Yakala', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e3-1-2', level: 3, module: 1, title: 'Seki Tanıyın', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e3-1-3', level: 3, module: 1, title: 'Çift Atari', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e3-1-4', level: 3, module: 1, title: 'Yakalama Yarışı', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e3-1-5', level: 3, module: 1, title: '3-3 Kombinasyon', type: 'Açılış', difficulty: 2 },
  { id: 'e3-1-6', level: 3, module: 1, title: '4-4 Hoshi Genişletme', type: 'Açılış', difficulty: 2 },
  { id: 'e3-2-1', level: 3, module: 2, title: 'Büyük Bambu', type: 'Grup Bağlama', difficulty: 3 },
  { id: 'e3-2-2', level: 3, module: 2, title: 'Grubu İkiye Bölün', type: 'Grup Kesme', difficulty: 3 },
  { id: 'e3-2-3', level: 3, module: 2, title: 'Çift Yaklaşım', type: 'Grup Bağlama', difficulty: 3 },
  { id: 'e3-2-4', level: 3, module: 2, title: 'Kesme Tehdidini Değerlendirin', type: 'Grup Kesme', difficulty: 4 },
  { id: 'e3-2-5', level: 3, module: 2, title: 'Grubu İkiye Böl 2', type: 'Alan Kontrolü', difficulty: 3 },
  { id: 'e3-2-6', level: 3, module: 2, title: 'Moyo Oluşturma', type: 'Alan Kontrolü', difficulty: 3 },
  { id: 'e3-2-7', level: 3, module: 2, title: 'Sınırı Genişletme', type: 'Alan Kontrolü', difficulty: 2 },
  { id: 'e3-3-1', level: 3, module: 3, title: 'Dört Düz Canlı', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e3-3-2', level: 3, module: 3, title: 'Köşede Yaşam', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e3-3-3', level: 3, module: 3, title: 'Ko Tehditi Yaratın', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e3-3-4', level: 3, module: 3, title: 'Sahte Gözle Yaşam', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e3-3-5', level: 3, module: 3, title: 'Çoklu Yose Hesaplama', type: 'Bitiriş', difficulty: 3 },
  { id: 'e3-3-6', level: 3, module: 3, title: 'Yose Sıralama', type: 'Bitiriş', difficulty: 3 },
  { id: 'e3-4-1', level: 3, module: 4, title: 'Kalınlık mı Alan mı?', type: 'Alan Kontrolü', difficulty: 3 },
  { id: 'e3-4-2', level: 3, module: 4, title: 'Büyük Moyo', type: 'Açılış', difficulty: 3 },
  { id: 'e3-4-3', level: 3, module: 4, title: 'Sınırı Genişletin', type: 'Alan Kontrolü', difficulty: 3 },
  { id: 'e3-4-4', level: 3, module: 4, title: 'İstilaa Karşı Savunma', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e3-4-5', level: 3, module: 4, title: 'İleri Tesuji', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e3-4-6', level: 3, module: 4, title: 'Kake Uygulama', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e3-4-7', level: 3, module: 4, title: 'Nuki Uygulama', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e3-5-1', level: 3, module: 5, title: 'Pozisyon Analizi', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e3-5-2', level: 3, module: 5, title: 'Ko Analizi', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e3-5-3', level: 3, module: 5, title: 'Avantaj Analizi', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e3-5-4', level: 3, module: 5, title: 'Şekil Analizi', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e3-5-5', level: 3, module: 5, title: 'Saldırı Kombinasyonu', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e3-5-6', level: 3, module: 5, title: 'Savunma Kombinasyonu', type: 'Grup Savunma', difficulty: 4 },
  { id: 'e3-5-7', level: 3, module: 5, title: 'Karşı Saldırı', type: 'Alan Kontrolü', difficulty: 3 },
  { id: 'e3-6-1', level: 3, module: 6, title: 'Ko Yaşama 2', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e3-6-2', level: 3, module: 6, title: 'Seki Çözümü', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e3-6-3', level: 3, module: 6, title: 'Bent Four Yaşama', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e3-6-4', level: 3, module: 6, title: 'Çift Ko', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e3-6-5', level: 3, module: 6, title: 'Üç taşla Yaşama', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e3-6-6', level: 3, module: 6, title: 'İleri Capture Kombinasyonu', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e3-r-1', level: 3, module: 7, title: 'Açılış ve Orta Oyun Geçişi', type: 'Açılış', difficulty: 3 },
  { id: 'e3-r-2', level: 3, module: 7, title: 'Tesuji ve Saldırı/Savunma', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e4-1-1', level: 4, module: 1, title: 'Büyük Yose', type: 'Bitiriş', difficulty: 3 },
  { id: 'e4-1-2', level: 4, module: 1, title: 'Dame Nuki', type: 'Bitiriş', difficulty: 3 },
  { id: 'e4-1-3', level: 4, module: 1, title: 'Skor Tahmini', type: 'Alan Kontrolü', difficulty: 3 },
  { id: 'e4-1-4', level: 4, module: 1, title: 'Sıra Değerlendirmesi', type: 'Bitiriş', difficulty: 4 },
  { id: 'e4-1-5', level: 4, module: 1, title: 'Joseki Uygulama', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e4-2-1', level: 4, module: 2, title: 'Çin Açılışı', type: 'Açılış', difficulty: 3 },
  { id: 'e4-2-2', level: 4, module: 2, title: 'Japon Açılışı', type: 'Açılış', difficulty: 3 },
  { id: 'e4-2-3', level: 4, module: 2, title: 'Kore Açılışı', type: 'Açılış', difficulty: 3 },
  { id: 'e4-2-4', level: 4, module: 2, title: 'Açılış Dengesi', type: 'Açılış', difficulty: 3 },
  { id: 'e4-2-5', level: 4, module: 2, title: 'Etki Hesaplama', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e4-2-6', level: 4, module: 2, title: 'Moyoyu Değerlendirme', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e4-3-1', level: 4, module: 3, title: 'İleri Snapback', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e4-3-2', level: 4, module: 3, title: 'Throw-in Atış', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e4-3-3', level: 4, module: 3, title: 'Kaçış Tekniği', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e4-3-4', level: 4, module: 3, title: 'Moyo Yaratma Teknikleri', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e4-3-5', level: 4, module: 3, title: 'Moyo Genişletme', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e4-4-1', level: 4, module: 4, title: 'İstila Stratejisi', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e4-4-2', level: 4, module: 4, title: 'Daraltma Taktiği', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e4-4-3', level: 4, module: 4, title: 'Oyun Sonu Sıralaması', type: 'Bitiriş', difficulty: 4 },
  { id: 'e4-4-4', level: 4, module: 4, title: 'Tam Oyunstratejisi', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e4-4-5', level: 4, module: 4, title: 'İleri İnvazyon', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e4-4-6', level: 4, module: 4, title: 'İnvazyon Savunması', type: 'Grup Savunma', difficulty: 4 },
  { id: 'e4-5-1', level: 4, module: 5, title: 'Kombinasyon: Kesme + Yaşam', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e4-5-2', level: 4, module: 5, title: 'Kombinasyon: Geta + Yakalama', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e4-5-3', level: 4, module: 5, title: 'Kombinasyon: Ko + Yaşam', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e4-5-4', level: 4, module: 5, title: 'Son Kombinasyon', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e4-5-5', level: 4, module: 5, title: 'Kombinasyon: Kesme+Ko', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e4-5-6', level: 4, module: 5, title: 'Kombinasyon: Geta+Kesme', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e4-6-1', level: 4, module: 6, title: 'Ko Savaşı', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e4-6-2', level: 4, module: 6, title: 'Seki Yaşama', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e4-6-3', level: 4, module: 6, title: 'Çift Göz Derinlemesi', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e4-6-4', level: 4, module: 6, title: 'Stratejik Moyo', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e4-6-5', level: 4, module: 6, title: 'Kombinasyon: Yaşama+Yakalama', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e4-6-6', level: 4, module: 6, title: 'Çoklu Geta', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e4-6-7', level: 4, module: 6, title: 'İleri Yaşatma Kombinasyonu', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e4-r-1', level: 4, module: 7, title: 'Joseki ve Etki Alanı Birleşimi', type: 'Açılış', difficulty: 4 },
  { id: 'e4-r-2', level: 4, module: 7, title: 'İstila ve Yaşam/Ölüm', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e4-r-3', level: 4, module: 7, title: 'Sentez: Çoklu Kavram', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e5-1-1', level: 5, module: 1, title: 'Çoklu Seçim Yakalama', type: 'Taş Yakalama', difficulty: 5 },
  { id: 'e5-1-2', level: 5, module: 1, title: 'Okuma İleri', type: 'Taş Yakalama', difficulty: 5 },
  { id: 'e5-1-3', level: 5, module: 1, title: 'Seki Bozma', type: 'Yaşam ve Ölüm', difficulty: 5 },
  { id: 'e5-1-4', level: 5, module: 1, title: 'İleri Geta', type: 'Taş Yakalama', difficulty: 5 },
  { id: 'e5-1-5', level: 5, module: 1, title: 'İleri Geta 2', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e5-2-1', level: 5, module: 2, title: 'Kiwi-Joseki', type: 'Açılış', difficulty: 5 },
  { id: 'e5-2-2', level: 5, module: 2, title: 'Karşılıklı Kesme Pozisyonları', type: 'Grup Kesme', difficulty: 5 },
  { id: 'e5-2-3', level: 5, module: 2, title: 'Kanat Formasyonu', type: 'Grup Bağlama', difficulty: 5 },
  { id: 'e5-2-4', level: 5, module: 2, title: 'Zincirleme Kesme', type: 'Grup Kesme', difficulty: 5 },
  { id: 'e5-2-5', level: 5, module: 2, title: 'Kiwi-Joseki 2', type: 'Açılış', difficulty: 4 },
  { id: 'e5-3-1', level: 5, module: 3, title: 'Dikdörtgen Altı', type: 'Yaşam ve Ölüm', difficulty: 5 },
  { id: 'e5-3-2', level: 5, module: 3, title: 'Ölü Köşe Şekilleri', type: 'Yaşam ve Ölüm', difficulty: 5 },
  { id: 'e5-3-3', level: 5, module: 3, title: 'Merkezde Yaşam', type: 'Yaşam ve Ölüm', difficulty: 5 },
  { id: 'e5-3-4', level: 5, module: 3, title: 'Çift Feda', type: 'Yaşam ve Ölüm', difficulty: 5 },
  { id: 'e5-3-5', level: 5, module: 3, title: 'Çift Feda 2', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e5-4-1', level: 5, module: 4, title: 'Yan Alana İndirgeme', type: 'Alan Kontrolü', difficulty: 5 },
  { id: 'e5-4-2', level: 5, module: 4, title: 'Saldırı mı Savunma mı?', type: 'Alan Kontrolü', difficulty: 5 },
  { id: 'e5-4-3', level: 5, module: 4, title: 'Alan Kararı', type: 'Alan Kontrolü', difficulty: 5 },
  { id: 'e5-4-4', level: 5, module: 4, title: 'Bütünsel Değerlendirme', type: 'Alan Kontrolü', difficulty: 5 },
  { id: 'e5-4-5', level: 5, module: 4, title: 'Yan Alana İndirgeme 2', type: 'Bitiriş', difficulty: 4 },
  { id: 'e5-5-1', level: 5, module: 5, title: 'Planlama Egzersizi', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e5-5-2', level: 5, module: 5, title: 'Fuseki Okuma 2', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e5-5-3', level: 5, module: 5, title: 'Taarruz Kombinasyonu 2', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e5-5-4', level: 5, module: 5, title: 'Mikro Yose Uygulama 2', type: 'Bitiriş', difficulty: 4 },
  { id: 'e5-5-5', level: 5, module: 5, title: 'İleri Ko Yaşama', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e5-5-6', level: 5, module: 5, title: 'Merdiven Kombinasyonu', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e5-5-7', level: 5, module: 5, title: 'Moyo Karşılaştırma', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e5-r-1', level: 5, module: 6, title: 'İleri Okuma ve Karmaşık Dövüş', type: 'Taş Yakalama', difficulty: 5 },
  { id: 'e5-r-2', level: 5, module: 6, title: 'Denge ve Sabırlı Oyun', type: 'Alan Kontrolü', difficulty: 5 },
  { id: 'e6-1-1', level: 6, module: 1, title: 'En Büyük Yose', type: 'Bitiriş', difficulty: 6 },
  { id: 'e6-1-2', level: 6, module: 1, title: 'Oyun Sonu Okuma', type: 'Bitiriş', difficulty: 6 },
  { id: 'e6-1-3', level: 6, module: 1, title: 'Sayma Alıştırması', type: 'Bitiriş', difficulty: 6 },
  { id: 'e6-1-4', level: 6, module: 1, title: 'Optimal Sıra', type: 'Bitiriş', difficulty: 6 },
  { id: 'e6-1-5', level: 6, module: 1, title: 'En Büyük Yose 2', type: 'Bitiriş', difficulty: 4 },
  { id: 'e6-2-1', level: 6, module: 2, title: 'San-Ren-Sei', type: 'Açılış', difficulty: 6 },
  { id: 'e6-2-2', level: 6, module: 2, title: 'Çin Fuseki Variations', type: 'Açılış', difficulty: 6 },
  { id: 'e6-2-3', level: 6, module: 2, title: 'Mini Çin', type: 'Açılış', difficulty: 6 },
  { id: 'e6-2-4', level: 6, module: 2, title: 'Açılışların Karşılaştırması', type: 'Açılış', difficulty: 6 },
  { id: 'e6-2-5', level: 6, module: 2, title: 'Modern Joseki 2', type: 'Açılış', difficulty: 4 },
  { id: 'e6-3-1', level: 6, module: 3, title: 'Geri Snapback', type: 'Taş Yakalama', difficulty: 6 },
  { id: 'e6-3-2', level: 6, module: 3, title: 'Çoklu Snapback', type: 'Taş Yakalama', difficulty: 6 },
  { id: 'e6-3-3', level: 6, module: 3, title: 'Semeai Zihniyeti', type: 'Yaşam ve Ölüm', difficulty: 6 },
  { id: 'e6-3-4', level: 6, module: 3, title: 'Kombinasyon Tesuji', type: 'Taş Yakalama', difficulty: 6 },
  { id: 'e6-3-5', level: 6, module: 3, title: 'Seten 2', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e6-4-1', level: 6, module: 4, title: 'Genel Strateji', type: 'Alan Kontrolü', difficulty: 6 },
  { id: 'e6-4-2', level: 6, module: 4, title: 'Orta Oyun Değerlendirmesi', type: 'Alan Kontrolü', difficulty: 6 },
  { id: 'e6-4-3', level: 6, module: 4, title: 'Tahtayı Bütün Olarak Görme', type: 'Yaşam ve Ölüm', difficulty: 6 },
  { id: 'e6-4-4', level: 6, module: 4, title: 'Final: Usta Sınıfı', type: 'Yaşam ve Ölüm', difficulty: 6 },
  { id: 'e6-4-5', level: 6, module: 4, title: 'Kesin Skorlama 2', type: 'Bitiriş', difficulty: 4 },
  { id: 'e6-5-1', level: 6, module: 5, title: 'Usta Ko Savaşı', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e6-5-2', level: 6, module: 5, title: 'Profesyonel Geta', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e6-5-3', level: 6, module: 5, title: 'Karmaşık Yaşama', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e6-5-4', level: 6, module: 5, title: 'Stratejik Denge', type: 'Alan Kontrolü', difficulty: 4 },
  { id: 'e6-5-5', level: 6, module: 5, title: 'Mikro Yose Detay', type: 'Bitiriş', difficulty: 4 },
  { id: 'e6-5-6', level: 6, module: 5, title: 'Çoklu Kombinasyon', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e6-5-7', level: 6, module: 5, title: 'Son Oyun Çözümü', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e6-5-8', level: 6, module: 5, title: 'Büyük Ko Savaşı', type: 'Yaşam ve Ölüm', difficulty: 4 },
  { id: 'e6-5-9', level: 6, module: 5, title: 'Profesyonel Kombinasyon', type: 'Taş Yakalama', difficulty: 4 },
  { id: 'e6-5-10', level: 6, module: 5, title: 'Tam Skorlama', type: 'Bitiriş', difficulty: 4 },
  { id: 'e6-r-1', level: 6, module: 6, title: 'Pro Analiz ve AI Stratejisi', type: 'Açılış', difficulty: 6 },
  { id: 'e6-r-2', level: 6, module: 6, title: 'Turnuva ve Mentörlük Sentezi', type: 'Alan Kontrolü', difficulty: 6 },
  { id: 'e6-r-3', level: 6, module: 6, title: 'Tüm Seviyelerin Sentezi', type: 'Yaşam ve Ölüm', difficulty: 6 },
  { id: 'e2-ms-1', level: 2, module: 6, title: 'Merdiven Okuma (2 Adım)', type: 'Çok Adımlı', difficulty: 3 },
  { id: 'e2-ms-2', level: 2, module: 6, title: 'İki Göz Yap (2 Adım)', type: 'Çok Adımlı', difficulty: 3 },
  { id: 'e3-ms-1', level: 3, module: 6, title: 'Tesuji Kombinasyonu (3 Adım)', type: 'Çok Adımlı', difficulty: 4 },
  { id: 'e3-ms-2', level: 3, module: 6, title: 'Çift Yönlü Savunma (2 Adım)', type: 'Çok Adımlı', difficulty: 3 },
  { id: 'e4-ms-1', level: 4, module: 6, title: 'İstila ve Yaşam (3 Adım)', type: 'Çok Adımlı', difficulty: 4 },
  { id: 'e4-ms-2', level: 4, module: 6, title: 'Atari-Kaçış-Yakalama (3 Adım)', type: 'Çok Adımlı', difficulty: 4 },
  { id: 'e5-ms-1', level: 5, module: 5, title: 'Karmaşık Okuma (4 Adım)', type: 'Çok Adımlı', difficulty: 5 },
];

const TYPE_COLORS: Record<string, string> = {
  'Doğru Hamle': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Taş Yakalama': 'bg-red-500/15 text-red-400 border-red-500/20',
  'Yaşam ve Ölüm': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Grup Bağlama': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'Grup Kesme': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'Grup Savunma': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Alan Kontrolü': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Bitiriş': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'Açılış': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  'Çok Adımlı': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
};

export function ExerciseView() {
  const {
    currentExercise, loadExercise,
  } = useAppStore();

  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    let items = EXERCISE_CATALOG;
    if (filterLevel !== null) items = items.filter(e => e.level === filterLevel);
    if (filterType !== null) items = items.filter(e => e.type === filterType);
    return items;
  }, [filterLevel, filterType]);

  const types = useMemo(() => [...new Set(EXERCISE_CATALOG.map(e => e.type))], []);

  if (currentExercise) return <ExercisePlayer />;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">Alıştırmalar</h2>
        <p className="text-text-secondary">Seviye ve türe göre filtreleyerek çalışın ({EXERCISE_CATALOG.length} alıştırma)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterLevel(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterLevel === null ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
          Tümü
        </button>
        {[1, 2, 3, 4, 5, 6].map(lvl => (
          <button key={lvl} onClick={() => setFilterLevel(lvl === filterLevel ? null : lvl)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterLevel === lvl ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
            Seviye {lvl}
          </button>
        ))}
        <span className="w-px h-6 bg-glass-border self-center mx-1" />
        <button onClick={() => setFilterType(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === null ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
          Tüm Türler
        </button>
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t === filterType ? null : t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === t ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCatalog.map(ex => (
          <button key={ex.id} onClick={() => loadExercise(ex.id)}
            className="glass rounded-2xl p-5 text-left card-hover border border-glass-border hover:border-accent/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_COLORS[ex.type] || 'glass text-text-secondary'}`}>
                {ex.type}
              </span>
              <span className="text-xs text-text-secondary">Seviye {ex.level}</span>
            </div>
            <h4 className="font-bold mb-1 group-hover:text-accent transition-colors">{ex.title}</h4>
            <div className="flex items-center gap-1 text-xs text-accent">
              {'★'.repeat(Math.max(0, Math.min(5, ex.difficulty || 0)))}{'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, ex.difficulty || 0))))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExercisePlayer() {
  const {
    currentExercise, exerciseResult, exerciseAttempts,
    submitExerciseMove, closeExercise, loadExercise,
    currentStepIndex, stepBoard, stepResults, allStepsCompleted,
    submitMultiStepMove, advanceToNextStep,
  } = useAppStore();

  const isMultiStep = currentExercise?.steps && currentExercise.steps.length > 0;

  const handleBoardClick = useCallback(async (x: number, y: number) => {
    if (exerciseResult || !currentExercise) return;
    if (isMultiStep && !allStepsCompleted) {
      const lastResult = stepResults[stepResults.length - 1];
      if (lastResult && !lastResult.correct) return;
      await submitMultiStepMove(x, y);
    } else {
      await submitExerciseMove(x, y);
    }
  }, [exerciseResult, submitExerciseMove, submitMultiStepMove, currentExercise, isMultiStep, stepResults, allStepsCompleted]);

  if (!currentExercise) return null;

  const boardSize = currentExercise.board_size as BoardSize;
  const steps = currentExercise.steps;
  const currentStep = isMultiStep && steps ? steps[currentStepIndex] : null;
  const lastStepResult = stepResults.length > 0 ? stepResults[stepResults.length - 1] : null;

  // Determine board for multi-step
  const board = isMultiStep && stepBoard
    ? stepBoard
    : createBoardFromStones(currentExercise.initial_stones, boardSize);

  const highlights: Highlight[] = [];
  if (!isMultiStep && exerciseResult && !exerciseResult.correct && exerciseResult.best_move) {
    highlights.push({ x: exerciseResult.best_move[0], y: exerciseResult.best_move[1], type: 'good' });
  }
  if (isMultiStep && lastStepResult && !lastStepResult.correct && lastStepResult.best_move) {
    highlights.push({ x: lastStepResult.best_move[0], y: lastStepResult.best_move[1], type: 'good' });
  }

  // Determine hints source
  const hints = isMultiStep && currentStep?.hints ? currentStep.hints : currentExercise.hints;

  // Current step description
  const stepDescription = isMultiStep && currentStep
    ? (currentStep.explanation || currentExercise.description)
    : currentExercise.description;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <button onClick={() => closeExercise()} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Tüm Alıştırmalar
        </button>

        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_COLORS[currentExercise.title] || ''}`}>
            {currentExercise.type}
          </span>
          <span className="text-xs">Zorluk: {'★'.repeat(Math.max(0, Math.min(5, currentExercise.difficulty || 0)))}{'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, currentExercise.difficulty || 0))))}</span>
        </div>
        <h2 className="text-2xl font-bold">{currentExercise.title}</h2>
        <p className="text-text-secondary mt-1">{stepDescription}</p>
      </div>

      {/* Multi-step indicator */}
      {isMultiStep && steps && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-secondary">
              Adım {currentStepIndex + 1} / {steps.length}
            </span>
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, idx) => {
              const isCompleted = idx < stepResults.length && stepResults[idx]?.correct;
              const isCurrent = idx === currentStepIndex;
              const isFailed = idx < stepResults.length && !stepResults[idx]?.correct;
              return (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    isCompleted ? 'bg-success' :
                    isFailed ? 'bg-error' :
                    isCurrent ? 'bg-accent' :
                    'bg-glass-border'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-sm glass rounded-2xl p-4">
            <Board
              size={boardSize}
              board={board}
              highlights={highlights}
              onIntersectionClick={handleBoardClick}
              interactive={!(exerciseResult || (isMultiStep && (allStepsCompleted || (lastStepResult && !lastStepResult.correct))))}
              showCoordinates={true}
            />
          </div>
        </div>

        <div className="lg:w-72 space-y-4">
          {/* Multi-step last step result */}
          {isMultiStep && lastStepResult && (
            <div className={`animate-scale-in rounded-2xl p-5 border ${
              lastStepResult.correct ? 'bg-success/10 border-success/30 glow-success' : 'bg-error/10 border-error/30 glow-error'
            }}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${lastStepResult.correct ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {lastStepResult.correct ? '✓' : '✗'}
                </div>
                <span className="font-bold">{lastStepResult.correct ? 'Doğru!' : 'Yanlış'}</span>
              </div>
              <p className="text-sm text-text-secondary">{lastStepResult.explanation}</p>
              {lastStepResult.correct && !allStepsCompleted && (
                <button
                  onClick={() => advanceToNextStep()}
                  className="mt-3 w-full btn-primary py-2 rounded-xl text-sm"
                >
                  Sonraki Adım →
                </button>
              )}
            </div>
          )}

          {/* Single-step result */}
          {!isMultiStep && exerciseResult && (
            <div className={`animate-scale-in rounded-2xl p-5 border ${
              exerciseResult.correct ? 'bg-success/10 border-success/30 glow-success' : 'bg-error/10 border-error/30 glow-error'
            }`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${exerciseResult.correct ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {exerciseResult.correct ? '✓' : '✗'}
                </div>
                <span className="font-bold">{exerciseResult.correct ? 'Doğru!' : 'Yanlış'}</span>
              </div>
              <p className="text-sm text-text-secondary">{exerciseResult.explanation}</p>
            </div>
          )}

          {/* Completed all steps */}
          {isMultiStep && allStepsCompleted && (
            <div className="animate-scale-in rounded-2xl p-5 border bg-success/10 border-success/30 glow-success">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold bg-success/20 text-success">✓</div>
                <span className="font-bold">Tüm Adımlar Tamamlandı!</span>
              </div>
              <p className="text-sm text-text-secondary">Tüm adımları başarıyla çözdünüz.</p>
            </div>
          )}

          <div className="glass rounded-2xl p-5">
            <div className="text-sm text-text-secondary mb-1">Deneme Sayısı</div>
            <div className="text-3xl font-bold">{exerciseAttempts}</div>
          </div>

          {/* Hints */}
          {hints.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-medium mb-2">İpuçları</div>
              {hints.slice(0, 1).map((hint, i) => (
                <p key={i} className="text-sm text-text-secondary">{hint}</p>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => closeExercise()} className="flex-1 btn-ghost py-2.5 rounded-xl text-sm">Listeye Dön</button>
            {(exerciseResult || (isMultiStep && (allStepsCompleted || (lastStepResult && !lastStepResult.correct)))) && (
              <button onClick={() => loadExercise(currentExercise.id)} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">Tekrar Dene</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function createBoardFromStones(stones: { x: number; y: number; color: string }[], size: number): (StoneColor | null)[][] {
  const board: (StoneColor | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const stone of stones) {
    if (stone.x >= 0 && stone.x < size && stone.y >= 0 && stone.y < size) {
      board[stone.y][stone.x] = stone.color as StoneColor;
    }
  }
  return board;
}

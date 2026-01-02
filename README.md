# Proyek Tally

Proyek ini adalah seperangkat alat yang dirancang untuk mempercepat proses penghitungan total transaksi dari tabel web. Ini terdiri dari dua komponen utama:

1.  **Aplikasi Terminal (CLI) Tally**: Antarmuka baris perintah yang dibuat dengan Node.js untuk menghitung dan memproses angka dari data teks.
2.  **Ekstensi Chrome "Table Scraper"**: Ekstensi browser sederhana untuk mengekstrak data dari tabel HTML dan menyalinnya ke papan klip.

Tujuan utamanya adalah mengotomatiskan tugas menyalin data transaksi secara manual, menempelkannya di suatu tempat, dan menghitung totalnya.

## Teknologi

-   **Aplikasi CLI**: Node.js, Chalk, Figlet, Commander
-   **Ekstensi Chrome**: JavaScript (ES6), HTML, CSS
-   **Bahasa Utama**: JavaScript (CommonJS di backend, ES6 di frontend)

## Fitur

### Aplikasi CLI Tally
-   UI terminal interaktif dengan menu yang mudah digunakan.
-   Secara otomatis memantau file input (`src/data/pastehere.txt`) untuk perubahan.
-   Menghitung jumlah total dari daftar transaksi.
-   Memungkinkan penambahan `non-tunai` dan `retur` untuk menyesuaikan total akhir.
-   Tampilan yang menarik dan penuh warna menggunakan `chalk` dan `figlet`.

### Ekstensi Table Scraper
-   Mengikis semua baris dari tabel pada halaman web aktif.
-   Menyalin data yang telah di-scrape ke papan klip, siap untuk ditempel.
-   Kemampuan untuk menavigasi halaman tabel (sebelumnya/berikutnya).
-   Menyimpan nilai filter terakhir yang digunakan.

## Cara Kerja

Alur kerja yang dimaksudkan adalah sebagai berikut:

1.  **Buka Situs Web**: Navigasikan ke halaman web yang berisi tabel transaksi yang ingin Anda hitung.
2.  **Scrape Data**: Klik ikon ekstensi "Table Scraper" di browser Anda. Data tabel akan disalin ke papan klip Anda.
3.  **Jalankan Aplikasi Tally**: Buka terminal Anda, navigasikan ke direktori proyek, dan jalankan `npm start`.
4.  **Mulai Input**: Di menu Tally CLI, pilih opsi `1` (Input) untuk membuka `pastehere.txt` secara otomatis.
5.  **Tempel Data**: Tempelkan data dari papan klip Anda ke dalam file `pastehere.txt` dan simpan.
6.  **Hitung Total**: Kembali ke terminal. Aplikasi akan mendeteksi perubahan file. Pilih opsi `2` (Hitung) untuk melihat jumlah total dan rinciannya.

## Pemasangan

### Prasyarat
-   [Node.js](https://nodejs.org/) (termasuk npm)
-   Browser berbasis Chromium (seperti Google Chrome, Brave, atau Edge)

### Langkah-langkah

1.  **Kloning Repositori**
    ```bash
    git clone <URL_REPOSITORI_ANDA>
    cd tally
    ```

2.  **Instal Dependensi Node.js**
    Jalankan perintah berikut di direktori root proyek:
    ```bash
    npm install
    ```

3.  **Muat Ekstensi Chrome**
    a. Buka browser Chrome Anda dan navigasikan ke `chrome://extensions`.
    b. Aktifkan "Developer mode" (Mode Pengembang) menggunakan sakelar di pojok kanan atas.
    c. Klik tombol "Load unpacked" (Muat yang belum dibuka).
    d. Pilih folder `ext` dari dalam direktori proyek Anda.
    e. Ekstensi "Table Scraper" sekarang akan muncul di daftar ekstensi Anda.

## Penggunaan

1.  **Jalankan Aplikasi CLI**
    Untuk memulai aplikasi Tally, jalankan perintah berikut di terminal:
    ```bash
    npm start
    ```
    Ini akan menampilkan menu utama di terminal Anda.

2.  **Gunakan Ekstensi**
    - Navigasikan ke halaman web dengan tabel.
    - Klik ikon ekstensi di bilah alat browser Anda.
    - Klik tombol "Scrape" untuk menyalin data tabel.

3.  **Gunakan File `pastehere.txt`**
    Setelah data disalin, gunakan opsi `input` di CLI untuk menempelkan dan menyimpan data Anda untuk diproses.

## Struktur Proyek

```
/
├── ext/                # Kode sumber untuk Ekstensi Chrome
│   ├── content.js      # Skrip yang berinteraksi dengan DOM halaman web
│   ├── manifest.json   # File konfigurasi ekstensi
│   └── popup.js        # Logika untuk UI popup ekstensi
│
├── src/                # Kode sumber untuk Aplikasi CLI Tally
│   ├── tally.cjs       # Skrip utama aplikasi CLI
│   └── data/
│       └── pastehere.txt # File input untuk ditempeli data
│
├── package.json        # Dependensi dan skrip proyek Node.js
└── README.md           # File ini
```

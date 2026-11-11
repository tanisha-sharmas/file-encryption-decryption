# 🔐 Secure File Encryption & Decryption

A lightweight, browser-based web application to **encrypt and decrypt any file** using a password.  
All cryptographic operations happen **entirely on the client side** — no file or password is ever uploaded to a server.

> 🛠️ **This project was built using IBM BOB.**

---

## ✨ Features

- Encrypt any file type (text, images, documents, etc.)
- AES-256-GCM authenticated encryption (confidentiality + integrity)
- PBKDF2 (SHA-256, 100,000 iterations) for secure key derivation
- Random salt & IV for every encryption (unique ciphertext each time)
- 100% client-side — no server, no upload, no data leakage
- Progress bar, status messages, password show/hide, reset button
- Responsive layout for desktop and mobile

## 🧰 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Cryptography:** Web Crypto API — AES-256-GCM + PBKDF2 (SHA-256)
- **Randomness:** `crypto.getRandomValues` for salt and IV
- **Localhost server:** Python `http.server` (127.0.0.1:8080)
- **No backend, no database, no external dependencies**

## 🚀 Run on Localhost

```bash
# Clone the repository
git clone https://github.com/tanisha-sharmas/file-encryption-decryption.git
cd file-encryption-decryption

# Start a local server
python3 -m http.server 8080

# Open in browser
# http://127.0.0.1:8080/
```

## 🔒 How It Works

1. User selects a file and enters a password.
2. A random 16-byte salt and 12-byte IV are generated.
3. PBKDF2 derives an AES-256 key from the password + salt (100k iterations).
4. AES-256-GCM encrypts the file contents.
5. Output file = `salt(16) + IV(12) + ciphertext`, saved as `.enc`.
6. Decryption reverses the steps using the same password.

## 📸 Screenshots

See the `screenshots/` folder for application screenshots.

## ⚠️ Security Notes

- Password strength is the user's responsibility — use 8+ characters.
- Wrong password or tampered file will fail decryption (authenticated encryption).
- Runs in the browser; beware of XSS or malicious extensions.

## 👩‍🎓 Author

- **Tanisha Sharma**
- Course: IBM SkillsBuild With ICT
- Program: B.Tech CSE, 7th Semester
- College: Mahant Bachittar Singh College of Engineering And Technology, Jammu

## 📄 License

This project is for educational purposes.

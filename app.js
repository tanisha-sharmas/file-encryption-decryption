const $ = (id) => document.getElementById(id);

let mode = "encrypt";

const tabs = document.querySelectorAll(".tab");
tabs.forEach((t) => {
  t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    mode = t.dataset.mode;
    updateUI();
  });
});

function updateUI() {
  const runBtn = $("runBtn");
  const confirmGroup = $("confirmGroup");
  if (mode === "encrypt") {
    runBtn.textContent = "Encrypt File";
    confirmGroup.style.display = "block";
  } else {
    runBtn.textContent = "Decrypt File";
    confirmGroup.style.display = "none";
  }
  setStatus("", "");
}

function setStatus(msg, type) {
  const el = $("status");
  if (!msg) { el.classList.remove("show"); return; }
  el.textContent = msg;
  el.className = "status show " + (type || "info");
}

function setProgress(pct) {
  $("progressWrap").style.display = pct >= 0 ? "flex" : "none";
  $("progress").style.width = pct + "%";
  $("progressText").textContent = Math.round(pct) + "%";
}

$("fileInput").addEventListener("change", () => {
  const f = $("fileInput").files[0];
  $("fileInfo").textContent = f ? `${f.name} (${formatBytes(f.size)})` : "";
});

$("togglePwd").addEventListener("click", () => {
  const inp = $("password");
  const btn = $("togglePwd");
  if (inp.type === "password") { inp.type = "text"; btn.textContent = "Hide"; }
  else { inp.type = "password"; btn.textContent = "Show"; }
});

$("resetBtn").addEventListener("click", () => {
  $("fileInput").value = "";
  $("password").value = "";
  $("confirmPassword").value = "";
  $("fileInfo").textContent = "";
  setStatus("", "");
  setProgress(-1);
});

updateUI();

$("runBtn").addEventListener("click", async () => {
  const file = $("fileInput").files[0];
  const pwd = $("password").value;
  if (!file) { setStatus("Please select a file first.", "error"); return; }
  if (!pwd) { setStatus("Please enter a password.", "error"); return; }
  if (mode === "encrypt") {
    const c = $("confirmPassword").value;
    if (pwd !== c) { setStatus("Passwords do not match.", "error"); return; }
  }

  $("runBtn").disabled = true;
  setProgress(0);
  try {
    if (mode === "encrypt") await encryptFile(file, pwd);
    else await decryptFile(file, pwd);
  } catch (e) {
    setStatus("Error: " + (e.message || e), "error");
  } finally {
    $("runBtn").disabled = false;
    setTimeout(() => setProgress(-1), 600);
  }
});

function formatBytes(b) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(2) + " MB";
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptFile(file, password) {
  setStatus("Reading file...", "info");
  setProgress(10);
  const buffer = await file.arrayBuffer();
  setProgress(30);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  setProgress(50);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, buffer);
  setProgress(75);

  // Pack: salt(16) + iv(12) + ciphertext
  const out = new Uint8Array(salt.length + iv.length + cipher.byteLength);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(new Uint8Array(cipher), salt.length + iv.length);

  const blob = new Blob([out], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name + ".enc";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setProgress(100);
  setStatus(`Encrypted successfully! Downloaded "${file.name}.enc".`, "success");
}

async function decryptFile(file, password) {
  setStatus("Reading file...", "info");
  setProgress(10);
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  if (data.length < 28) { throw new Error("File is too small / not a valid encrypted file."); }
  setProgress(25);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const cipher = data.slice(28);
  const key = await deriveKey(password, salt);
  setProgress(50);
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  } catch (e) {
    throw new Error("Decryption failed. Wrong password or corrupted file.");
  }
  setProgress(80);

  // Try to recover original filename
  let name = file.name.replace(/\.enc$/i, "");
  if (name === file.name) name = "decrypted_file";

  const blob = new Blob([plain]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setProgress(100);
  setStatus(`Decrypted successfully! Downloaded "${name}".`, "success");
}

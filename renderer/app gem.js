const $ = (id) => document.getElementById(id);
let user = null, plan = "free", preview = false, mode = "chat", history = [], pendingKey = null;

const paid = () => plan !== "free" && !preview;
function say(el, t) { el.textContent = t; }
function hello() {
  $("chat").innerHTML = "";
  const h = document.createElement("div"); h.className = "hello";
  h.innerHTML = "<h2>What can I help with?</h2><p>Ask anything, in any language.</p><div class='chips'></div>";
  ["Explain something simply", "Help me write an email", "Plan my week", "Translate a text"].forEach((t) => {
    const c = document.createElement("span"); c.className = "chip"; c.textContent = t;
    c.onclick = () => { $("msg").value = t; $("msg").focus(); }; h.lastChild.appendChild(c);
  });
  $("chat").appendChild(h);
}
function add(text, who) {
  const h = document.querySelector(".hello"); if (h) h.remove();
  const d = document.createElement("div"); d.className = "m" + (who === "u" ? " u" : ""); d.textContent = text;
  $("chat").appendChild(d); $("chat").scrollTop = 1e9;
}
function render() {
  const open = !!user || preview;
  $("lock").style.display = open ? "none" : "flex";
  $("app").classList.toggle("on", open);
  $("plan").textContent = preview ? "PREVIEW" : plan.toUpperCase();
  $("who").textContent = user ? user.email : "Setup mode, not signed in";
  $("lockic").textContent = paid() ? "" : "🔒";
  $("mcode").classList.toggle("sel", mode === "code"); $("mchat").classList.toggle("sel", mode === "chat");
  $("signout").style.display = user || preview ? "" : "none";
}
async function refresh() {
  const r = await gem.call("me");
  if (r && r.email) { user = r; plan = r.plan || "free"; preview = false; }
  else { user = null; plan = "free"; }
  if (r && r.error === "not_configured") { $("preview").style.display = ""; say($("lstat"), "The GemAI server isn't connected yet."); }
  render();
  if (user && pendingKey) { const k = pendingKey; pendingKey = null; redeem(k); }
}
async function redeem(k) {
  const r = await gem.call("redeem", { key: k });
  if (r.ok) { add("Key redeemed. Your plan is now " + (r.plan || "upgraded") + ".", "a"); refresh(); }
  else add("Couldn't redeem that key: " + (r.error || "check it and try again") + ".", "a");
}
async function send() {
  const t = $("msg").value.trim(); if (!t) return;
  if (mode === "code" && !paid()) { add("GemCode is for Beginner and Pro plans. Redeem a key to unlock it.", "a"); return; }
  $("msg").value = ""; add(t, "u"); history.push({ role: "user", content: t });
  const r = await gem.call("chat", { messages: history, mode });
  const out = r.reply || (r.error === "not_configured" ? "Preview mode: the AI server isn't connected yet." : "Something went wrong (" + (r.error || "unknown") + "). Try again.");
  if (r.reply) history.push({ role: "assistant", content: r.reply });
  add(out, "a");
}
$("google").onclick = async () => {
  const r = await gem.signIn();
  say($("lstat"), r.error ? "Sign-in isn't set up yet." : "Finish signing in in your browser, then come back here.");
};
$("lunlock").onclick = () => {
  const k = $("lkey").value.trim(); if (!k) return;
  pendingKey = k; say($("lstat"), "Sign in with Google first. Your key will be applied right after.");
};
$("preview").onclick = () => { preview = true; render(); hello(); };
$("signout").onclick = async () => { await gem.signOut(); user = null; preview = false; plan = "free"; history = []; render(); };
$("redeem").onclick = () => { const k = $("key").value.trim(); if (k) { $("key").value = ""; user ? redeem(k) : add("Sign in first to redeem a key.", "a"); } };
$("mchat").onclick = () => { mode = "chat"; render(); };
$("mcode").onclick = () => { mode = "code"; render(); if (!paid()) add("GemCode is for Beginner and Pro plans. Redeem a key to unlock it.", "a"); };
$("newc").onclick = () => { history = []; hello(); };
$("send").onclick = send; $("msg").onkeydown = (e) => { if (e.key === "Enter") send(); };
$("acc").oninput = (e) => { document.documentElement.style.setProperty("--accent", e.target.value); localStorage.setItem("acc", e.target.value); };
$("th").onchange = (e) => { document.documentElement.dataset.theme = e.target.value; localStorage.setItem("th", e.target.value); };
const a = localStorage.getItem("acc"), t = localStorage.getItem("th");
if (a) { document.documentElement.style.setProperty("--accent", a); $("acc").value = a; }
if (t) { document.documentElement.dataset.theme = t; $("th").value = t; }
gem.onAuth(refresh);
hello(); refresh();

const $ = (id) => document.getElementById(id);
let plan = "free", user = null, history = [];

function add(text, who) {
  const d = document.createElement("div");
  d.className = "m " + (who === "u" ? "u" : "");
  d.textContent = text;
  $("chat").appendChild(d);
  $("chat").scrollTop = 1e9;
}
function render() {
  $("plan").textContent = plan.toUpperCase();
  $("who").textContent = user ? user.email : "Not signed in";
  $("signin").style.display = user ? "none" : "";
  $("signout").style.display = user ? "" : "none";
  $("redeem").style.display = user ? "" : "none";
  $("send").disabled = !user;
  $("msg").placeholder = user ? "Message GemAI" : "Sign in with Google to start";
  $("codeopt").disabled = plan === "free";
  if (plan === "free" && $("mode").value === "code") $("mode").value = "chat";
}
async function refresh() {
  const r = await gem.call("me");
  if (r && r.email) { user = r; plan = r.plan || "free"; } else { user = null; plan = "free"; }
  render();
}
async function send() {
  const t = $("msg").value.trim();
  if (!t) return;
  $("msg").value = "";
  add(t, "u");
  history.push({ role: "user", content: t });
  const r = await gem.call("chat", { messages: history, mode: $("mode").value });
  const out = r.reply || (r.error === "not_configured"
    ? "The GemAI server isn't connected yet. Set API_BASE in config.json."
    : "Something went wrong: " + (r.error || "unknown error") + ". Try again.");
  if (r.reply) history.push({ role: "assistant", content: r.reply });
  add(out, "a");
}
$("send").onclick = send;
$("msg").onkeydown = (e) => { if (e.key === "Enter") send(); };
$("signin").onclick = async () => {
  const r = await gem.signIn();
  if (r.error) add("Sign-in isn't set up yet. Set SITE_URL in config.json.", "a");
};
$("signout").onclick = async () => { await gem.signOut(); history = []; refresh(); };
$("redeemBtn").onclick = async () => {
  const r = await gem.call("redeem", { key: $("key").value.trim() });
  if (r.ok) { add("Key redeemed. Your plan is now " + (r.plan || "upgraded") + ".", "a"); $("key").value = ""; refresh(); }
  else add("Couldn't redeem that key: " + (r.error || "check the key and try again") + ".", "a");
};
$("acc").oninput = (e) => { document.documentElement.style.setProperty("--accent", e.target.value); localStorage.setItem("acc", e.target.value); };
$("th").onchange = (e) => { document.documentElement.dataset.theme = e.target.value; localStorage.setItem("th", e.target.value); };
const a = localStorage.getItem("acc"), t = localStorage.getItem("th");
if (a) { document.documentElement.style.setProperty("--accent", a); $("acc").value = a; }
if (t) { document.documentElement.dataset.theme = t; $("th").value = t; }
gem.onAuth(refresh);
add("Welcome to GemAI. Sign in with Google to start chatting.", "a");
refresh();

const chatEl = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const kpisEl = document.getElementById("kpis");
const logsEl = document.getElementById("logs");

const messages = [
  { role: "system", content: "You are the virtual assistant for Schengen Visa Consultancy Limited (England-based). Provide specific, compliant guidance on Schengen visas, document lists, timelines, and next steps. Keep tone professional, concise, and helpful. Always offer to capture lead info (name, email, phone) when appropriate." }
];

function addMessage(role, content) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  const meta = document.createElement("div");
  meta.className = "role";
  meta.textContent = role.toUpperCase();
  const body = document.createElement("div");
  body.className = "content";
  body.textContent = content;
  wrap.appendChild(meta);
  wrap.appendChild(body);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function refreshMetrics() {
  try {
    const r = await fetch("/api/metrics");
    const data = await r.json();
    const items = [];
    const k = data.kpis || {};
    items.push(renderKPI("Leads", k.leads_per_day?.current ?? 0, null));
    items.push(renderKPI("Conversion rate", ((k.conversion_rate?.current||0)*100).toFixed(1)+'%', null));
    items.push(renderKPI("First response (avg)", Math.round(k.first_response_ms?.current||0)+' ms', null));
    items.push(renderKPI("CSAT avg", (k.csat_avg?.current||0).toFixed(2), null));
    kpisEl.innerHTML = items.join("");
    logsEl.textContent = (data.logs || []).map(l=>JSON.stringify(l)).join("\n");
  } catch {
    kpisEl.textContent = "Metrics unavailable on this deployment.";
  }
}

function renderKPI(label, current, target) {
  const goal = target != null ? `<small>Target: ${target}</small>` : "";
  return `<div class="kpi-item"><span>${label}</span><span><strong>${current ?? "-"}</strong> ${goal}</span></div>`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = input.value.trim();
  if (!content) return;
  input.value = "";

  addMessage("user", content);
  messages.push({ role: "user", content });

  sendBtn.disabled = true;
  sendBtn.textContent = "Thinking...";
  const t0 = Date.now();

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, first_response_start_ms: t0 })
    });
    const data = await resp.json();
    if (!resp.ok) {
      addMessage("assistant", `Error: ${data.error || "Unknown"}\n${data.details || ""}`);
    } else {
      const text = data.content || "";
      messages.push({ role: "assistant", content: text });
      addMessage("assistant", text);
      await fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "lead" }) });
    }
  } catch (err) {
    addMessage("assistant", "Network error. Check deployment/API key.");
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    refreshMetrics();
  }
});

document.addEventListener("click", async (e) => {
  const evt = e.target.getAttribute("data-evt");
  const cs = e.target.getAttribute("data-csat");
  if (evt) { await fetch("/api/event", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ type: evt })}); refreshMetrics(); }
  if (cs) { await fetch("/api/event", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ type: "csat", value: Number(cs) })}); refreshMetrics(); }
});

addMessage("assistant", "Hi! I'm the Schengen Visa assistant. Ask me anything about your application — I can also take your contact details to schedule a consultation.");
refreshMetrics();
setInterval(refreshMetrics, 10000);

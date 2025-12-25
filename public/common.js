const ws = new WebSocket(
  (location.protocol === "https:" ? "wss://" : "ws://") + location.host
);

const pc = new RTCPeerConnection({
  iceServers: [{ urls:"stun:stun.l.google.com:19302" }]
});

let my = localStorage.getItem("myNumber");
if (!my) {
  my = "7" + Math.floor(1000000 + Math.random()*9000000);
  localStorage.setItem("myNumber", my);
}

ws.onopen = () => {
  ws.send(JSON.stringify({ type:"register", number: my }));
};

ws.onmessage = async e => {
  const d = JSON.parse(e.data);

  if (d.type === "incoming") {
    localStorage.setItem("peer", d.from);
    location.href = "chakusin.html";
  }

  if (d.offer) {
    await pc.setRemoteDescription(d.offer);
    const ans = await pc.createAnswer();
    await pc.setLocalDescription(ans);
    ws.send(JSON.stringify({ type:"signal", answer: ans, to: localStorage.getItem("peer") }));
  }

  if (d.answer) await pc.setRemoteDescription(d.answer);
  if (d.ice) await pc.addIceCandidate(d.ice);
};

pc.onicecandidate = e => {
  if (e.candidate) {
    ws.send(JSON.stringify({
      type:"signal",
      ice:e.candidate,
      to: localStorage.getItem("peer")
    }));
  }
};

async function startCall(to) {
  localStorage.setItem("peer", to);
  const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  stream.getTracks().forEach(t => pc.addTrack(t, stream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  ws.send(JSON.stringify({ type:"call", to }));
  ws.send(JSON.stringify({ type:"signal", offer, to }));
}

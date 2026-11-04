/* Fonction serverless Vercel : reçoit le formulaire de contact et l'envoie par e-mail via Resend.
   Variables d'environnement (Vercel > Settings > Environment Variables) :
   - RESEND_API_KEY : clé API Resend (obligatoire)
   - CONTACT_TO     : destinataire (défaut : contact@oswaldsolutions.fr)
   - CONTACT_FROM   : expéditeur, sur un domaine vérifié dans Resend
                      (défaut : "Oswald Solutions <onboarding@resend.dev>", test uniquement) */

var PROJETS = {
  "nouveau-site": "Nouveau site",
  "refonte": "Refonte",
  "landing-page": "Landing page",
  "e-commerce": "Site e-commerce",
  "maintenance": "Maintenance",
  "care-plan": "Care Plan",
  "autre": "Autre"
};

var BUDGETS = {
  "moins-1500": "Moins de 1 500 €",
  "1500-3000": "1 500 € – 3 000 €",
  "3000-6000": "3 000 € – 6 000 €",
  "plus-6000": "Plus de 6 000 €"
};

var clean = function (v, max) {
  return String(v == null ? "" : v).replace(/\r/g, "").trim().slice(0, max);
};

var oneLine = function (v, max) {
  return clean(v, max).replace(/[\n\t]+/g, " ");
};

var esc = function (s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  /* champ piège : les robots le remplissent, on fait semblant d'avoir réussi */
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  var nom = oneLine(body.nom, 120);
  var entreprise = oneLine(body.entreprise, 120);
  var email = oneLine(body.email, 200);
  var projet = PROJETS[body.projet] || "";
  var budget = BUDGETS[body.budget] || "Non défini";
  var message = clean(body.message, 5000);
  var page = oneLine(body.page, 300);

  var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!nom || !emailOk || !projet || !message) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  var key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY manquante");
    return res.status(500).json({ ok: false, error: "not_configured" });
  }

  var to = process.env.CONTACT_TO || "contact@oswaldsolutions.fr";
  var from = process.env.CONTACT_FROM || "Oswald Solutions <onboarding@resend.dev>";

  var rows = [
    ["Nom", nom],
    ["Entreprise", entreprise || "—"],
    ["Email", email],
    ["Type de projet", projet],
    ["Budget indicatif", budget],
    ["Page", page || "—"]
  ];

  var text = rows.map(function (r) { return r[0] + " : " + r[1]; }).join("\n") + "\n\nMessage :\n" + message;
  var html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#0b1f1d">' +
    '<h2 style="margin:0 0 16px">Nouvelle demande de devis</h2>' +
    '<table style="border-collapse:collapse">' +
    rows.map(function (r) {
      return '<tr><td style="padding:4px 16px 4px 0;color:#5b6b69">' + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>";
    }).join("") +
    "</table>" +
    '<p style="margin:20px 0 6px;color:#5b6b69">Message</p>' +
    '<p style="margin:0;white-space:pre-wrap">' + esc(message) + "</p></div>";

  try {
    var r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from,
        to: [to],
        reply_to: email,
        subject: "Demande de devis — " + nom + " (" + projet + ")",
        text: text,
        html: html
      })
    });
    if (!r.ok) {
      console.error("Resend", r.status, await r.text());
      return res.status(502).json({ ok: false, error: "send_failed" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Resend", e);
    return res.status(502).json({ ok: false, error: "send_failed" });
  }
};

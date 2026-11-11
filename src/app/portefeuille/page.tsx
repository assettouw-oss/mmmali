"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PortefeuillePage() {
  const [solde, setSolde] = useState(500);
  const [showDepot, setShowDepot] = useState(false);
  const [showRetrait, setShowRetrait] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("");
  const [numero, setNumero] = useState("");
  const [transactions, setTransactions] = useState([
    { type: "Bonus inscription", montant: 500, date: "Aujourd'hui", statut: "réussi", icon: "🎁" },
  ]);

  const num = Number(montant);
  const valide = num >= 5000;

  function confirmDepot() {
    if (!valide) return alert("Minimum 5 000 F");
    setShowDepot(false); setShowPaiement(true);
  }
  function finalDepot() {
    if (!mode || !numero) return alert("Choisis mode et numéro");
    setSolde(solde + num);
    setTransactions([{ type: `Dépôt via ${mode}`, montant: num, date: "Maintenant", statut: "en cours", icon: "⬆️" }, ...transactions]);
    setShowPaiement(false); setMontant(""); setMode(""); setNumero("");
    alert(`✅ Dépôt ${num.toLocaleString()}F via ${mode} demandé !`);
  }
  function finalRetrait() {
    if (!valide) return alert("Minimum 5 000 F");
    if (num > solde) return alert("Solde insuffisant");
    if (!mode || !numero) return alert("Choisis mode et numéro");
    setSolde(solde - num);
    setTransactions([{ type: `Retrait vers ${mode}`, montant: -num, date: "Maintenant", statut: "en cours", icon: "⬇️" }, ...transactions]);
    setShowRetrait(false); setMontant(""); setMode(""); setNumero("");
    alert(`✅ Retrait ${num.toLocaleString()}F vers ${mode} en cours`);
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-20">
      <div className="bg-white p-4 border-b flex items-center gap-3">
        <Link href="/compte" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">←</Link>
        <p className="font-black">Portefeuille (Solde)</p>
      </div>

      <div className="p-4">
        <div className="bg-black text-white rounded-[20px] p-6">
          <p className="text-[11px] opacity-60">SOLDE DISPONIBLE • FCFA</p>
          <p className="text-4xl font-black mt-1">{solde.toLocaleString()} F</p>
          <p className="text-[11px] mt-2 opacity-60">Compte lié: Orange Money / Wave</p>
          <div className="flex gap-3 mt-5">
            <button onClick={()=>{ setMontant(""); setShowDepot(true); }} className="flex-1 bg-[#0a7a2e] py-3 rounded-full font-black text-sm">+ Dépôt</button>
            <button onClick={()=>{ setMontant(""); setShowRetrait(true); }} className="flex-1 bg-white text-black py-3 rounded-full font-black text-sm">↓ Retrait</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white border rounded-xl p-3"><p className="text-[11px] text-gray-500">Total ventes</p><p className="font-black">0 F</p></div>
          <div className="bg-white border rounded-xl p-3"><p className="text-[11px] text-gray-500">En attente</p><p className="font-black">0 F</p></div>
        </div>

        <p className="font-black text-[13px] mt-6">Transactions</p>
        <div className="bg-white border rounded-2xl divide-y mt-2">
          {transactions.map((t,i)=>(
            <div key={i} className="flex justify-between p-4"><div className="flex gap-3"><span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">{t.icon}</span><div><p className="text-[13px] font-bold">{t.type}</p><p className="text-[11px] text-gray-500">{t.date} • {t.statut}</p></div></div><p className={`font-black text-sm ${t.montant<0 ? "text-red-600" : "text-green-600"}`}>{t.montant>0?"+":""}{t.montant.toLocaleString()} F</p></div>
          ))}
        </div>
      </div>

      {showDepot && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end"><div className="bg-white w-full rounded-t-[24px] p-6">
          <h3 className="font-black">Quel montant déposer ?</h3><p className="text-[11px] text-gray-500">Minimum 5 000 F - Maximum illimité</p>
          <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} placeholder="5000" className={`w-full p-4 border-2 rounded-xl mt-4 font-black text-lg ${montant && !valide ? "border-red-500" : montant && valide ? "border-green-500" : ""}`} />
          {montant && !valide && <p className="text-xs text-red-600 mt-1">❌ Minimum 5 000 F - Tu as mis {num}</p>}
          {valide && <p className="text-xs text-green-600 mt-1">✅ {num.toLocaleString()} F accepté (5 000 à 6 000 et plus)</p>}
          <div className="flex gap-3 mt-4"><button onClick={()=>setShowDepot(false)} className="flex-1 py-3 border rounded-full">Annuler</button><button onClick={confirmDepot} disabled={!valide} className={`flex-1 py-3 rounded-full font-black text-white ${valide ? "bg-black" : "bg-gray-300"}`}>Continuer</button></div>
        </div></div>
      )}

      {showPaiement && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end"><div className="bg-white w-full rounded-t-[24px] p-6 max-h-[85vh] overflow-auto">
          <h3 className="font-black">Mode de paiement - {num.toLocaleString()} F</h3>
          <div className="space-y-2 mt-3">
            {[{id:"Orange Money", c:"bg-orange-500"}, {id:"Wave Mali", c:"bg-blue-500"}, {id:"Moov Money", c:"bg-blue-800"}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} className={`w-full p-4 border-2 rounded-xl flex justify-between ${mode===m.id ? "border-black bg-gray-50" : ""}`}><span className="flex gap-3"><span className={`w-8 h-8 ${m.c} rounded-full`}></span>{m.id}</span>{mode===m.id && <span>✓</span>}</button>
            ))}
          </div>
          <input value={numero} onChange={e=>setNumero(e.target.value)} placeholder="Numéro 70 00 00 00" className="w-full p-3 border rounded-xl mt-3" />
          <button onClick={finalDepot} className="w-full bg-[#0a7a2e] text-white py-4 rounded-full font-black mt-4">Confirmer le dépôt</button>
          <button onClick={()=>{ setShowPaiement(false); setShowDepot(true); }} className="w-full text-xs underline mt-2">Retour</button>
        </div></div>
      )}

      {showRetrait && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end"><div className="bg-white w-full rounded-t-[24px] p-6">
          <h3 className="font-black">Retrait - Solde {solde.toLocaleString()} F</h3>
          <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} placeholder="5000" className="w-full p-4 border-2 rounded-xl mt-3 font-black" />
          <div className="space-y-2 mt-3">{["Orange Money","Wave Mali","Moov Money"].map(m=><button key={m} onClick={()=>setMode(m)} className={`w-full p-3 border rounded-xl text-left ${mode===m ? "border-black bg-gray-50" : ""}`}>{m} {mode===m && "✓"}</button>)}</div>
          <input value={numero} onChange={e=>setNumero(e.target.value)} placeholder="Numéro retrait" className="w-full p-3 border rounded-xl mt-3" />
          <button onClick={finalRetrait} className="w-full bg-black text-white py-4 rounded-full font-black mt-4">Confirmer le retrait</button>
          <button onClick={()=>setShowRetrait(false)} className="w-full text-xs underline mt-2">Annuler</button>
        </div></div>
      )}
    </div>
  );
}
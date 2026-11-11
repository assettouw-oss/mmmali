"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdressesPage() {
  const [adresses, setAdresses] = useState([
    { id: 1, label: "Domicile", nom: "Adama Sylla", phone: "70 00 00 00", ville: "Bamako", quartier: "Hamdallaye ACI 2000", rue: "Rue 123, Porte 456", defaut: true },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", nom: "", phone: "", ville: "Bamako", quartier: "", rue: "" });

  function ajouter() {
    if (!form.nom || !form.phone || !form.quartier) return alert("Nom, téléphone, quartier obligatoires");
    setAdresses([...adresses, { id: Date.now(), ...form, defaut: false }]);
    setShowForm(false); setForm({ label: "", nom: "", phone: "", ville: "Bamako", quartier: "", rue: "" });
    alert("✅ Adresse ajoutée !");
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-20">
      <div className="bg-white p-4 border-b flex items-center gap-3">
        <Link href="/compte" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">←</Link>
        <p className="font-black">Mes Adresses de livraison</p>
      </div>

      <div className="p-4">
        <p className="text-[11px] text-gray-500">Gère tes adresses pour livraison rapide. Les livreurs mmmali te livrent à domicile.</p>

        <div className="mt-4 space-y-3">
          {adresses.map(a=>(
            <div key={a.id} className="bg-white border rounded-2xl p-4">
              <div className="flex justify-between"><p className="font-bold text-sm flex items-center gap-2">{a.defaut ? "🏠" : "📍"} {a.label || "Domicile"} {a.defaut && <span className="bg-[#0a7a2e] text-white text-[8px] px-2 py-0.5 rounded-full">PAR DÉFAUT</span>}</p><button className="text-xs">⋯</button></div>
              <p className="text-[13px] mt-2 font-bold">{a.nom} - {a.phone}</p>
              <p className="text-[12px] text-gray-600">{a.ville}, {a.quartier}, {a.rue}</p>
              <div className="flex gap-2 mt-3"><button className="text-[11px] border px-3 py-1.5 rounded-full">Modifier</button><button onClick={()=>setAdresses(adresses.filter(x=>x.id!==a.id))} className="text-[11px] border px-3 py-1.5 rounded-full text-red-600">Supprimer</button>{!a.defaut && <button onClick={()=>setAdresses(adresses.map(x=>({...x, defaut: x.id===a.id})))} className="text-[11px] bg-black text-white px-3 py-1.5 rounded-full">Définir par défaut</button>}</div>
            </div>
          ))}
        </div>

        <button onClick={()=>setShowForm(true)} className="w-full border-2 border-dashed border-gray-300 bg-white rounded-2xl p-4 mt-4 text-sm font-bold">+ Ajouter nouvelle adresse</button>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4 text-[11px]"><p className="font-bold">🚚 Info livraison:</p><p className="mt-1">Bamako: 1000F - 1500F / 24h • Régions: 2500F - 4000F / 48-72h • Paiement à la livraison Wave/OM.</p></div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end"><div className="bg-white w-full rounded-t-[24px] p-6 max-h-[90vh] overflow-auto">
          <h3 className="font-black">Nouvelle adresse</h3>
          <div className="space-y-3 mt-4">
            <select value={form.label} onChange={e=>setForm({...form, label:e.target.value})} className="w-full p-3 border rounded-xl text-sm"><option value="">Type adresse</option><option>Domicile</option><option>Bureau</option><option>Boutique</option><option>Autre</option></select>
            <input value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} placeholder="Nom complet" className="w-full p-3 border rounded-xl text-sm" />
            <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="Téléphone 70 00 00 00" className="w-full p-3 border rounded-xl text-sm" />
            <select value={form.ville} onChange={e=>setForm({...form, ville:e.target.value})} className="w-full p-3 border rounded-xl text-sm"><option>Bamako</option><option>Kayes</option><option>Sikasso</option><option>Ségou</option><option>Mopti</option></select>
            <input value={form.quartier} onChange={e=>setForm({...form, quartier:e.target.value})} placeholder="Quartier (Hamdallaye, ACI...)" className="w-full p-3 border rounded-xl text-sm" />
            <input value={form.rue} onChange={e=>setForm({...form, rue:e.target.value})} placeholder="Rue / Porte / Repère" className="w-full p-3 border rounded-xl text-sm" />
          </div>
          <button onClick={ajouter} className="w-full bg-black text-white py-4 rounded-full font-black mt-5">Enregistrer adresse</button>
          <button onClick={()=>setShowForm(false)} className="w-full text-xs underline mt-2">Annuler</button>
        </div></div>
      )}
    </div>
  );
}
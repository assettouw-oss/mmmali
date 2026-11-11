"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function PublicationsPage() {
  const [user, setUser] = useState<any>(null);
  const [produits, setProduits] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ titre: "", prix: "", categorie: "electronique", ville: "Bamako", description: "", image_url: "", video_url: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return (window.location.href = "/connexion");
      setUser(user);
      const { data } = await supabase.from("produits").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setProduits(data);
    }
    load();
  }, []);

  async function uploadFile(e:any, type:"image"|"video") {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const bucket = type==="image" ? "produits-images" : "produits-videos";
      // si bucket n'existe pas, on met en base64 temporaire pour test
      const reader = new FileReader();
      reader.onload = () => {
        if (type==="image") setForm(f=>({...f, image_url: reader.result as string}));
        else setForm(f=>({...f, video_url: reader.result as string}));
        setUploading(false);
      };
      reader.readAsDataURL(file);
      // Essai upload supabase storage
      await supabase.storage.from(bucket).upload(fileName, file).catch(()=>{});
    } catch { setUploading(false); }
  }

  async function saveProduit() {
    if (!form.titre || !form.prix || !form.image_url) return alert("Titre, prix, photo obligatoires");
    const payload = {
      user_id: user.id,
      titre: form.titre,
      prix: Number(form.prix),
      categorie: form.categorie,
      ville: form.ville,
      description: form.description,
      image_url: form.image_url,
      video_url: form.video_url || null,
    };
    let error;
    if (editing) {
      const res = await supabase.from("produits").update(payload).eq("id", editing.id);
      error = res.error;
    } else {
      const res = await supabase.from("produits").insert(payload);
      error = res.error;
    }
    if (error) return alert(error.message);
    alert(editing ? "Produit modifie !" : "Produit publie !");
    setShowForm(false); setEditing(null);
    setForm({ titre: "", prix: "", categorie: "electronique", ville: "Bamako", description: "", image_url: "", video_url: "" });
    const { data } = await supabase.from("produits").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setProduits(data);
  }

  async function supprimer(id:string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("produits").delete().eq("id", id);
    setProduits(produits.filter(p=>p.id!==id));
  }

  function editProduit(p:any) {
    setEditing(p);
    setForm({ titre: p.titre, prix: String(p.prix), categorie: p.categorie || "electronique", ville: p.ville || "Bamako", description: p.description || "", image_url: p.image_url, video_url: p.video_url || "" });
    setShowForm(true);
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-20">
      <div className="bg-white p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/compte" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">←</Link><p className="font-black">Mes Publications 🎥</p></div>
        <button onClick={()=>{ setEditing(null); setForm({ titre: "", prix: "", categorie: "electronique", ville: "Bamako", description: "", image_url: "", video_url: "" }); setShowForm(true); }} className="bg-black text-white px-4 py-2 rounded-full text-xs font-black">+ Publier</button>
      </div>

      <div className="p-3">
        <div className="bg-[#0a7a2e] text-white rounded-xl p-3 text-[11px]">📸 Publie photo + vidéo de tes marchandises. Elles apparaissent dans Accueil, Reels et Catégories.</div>

        {produits.length===0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center mt-4">
            <div className="text-5xl">📦</div>
            <p className="font-black mt-2">Aucune publication</p><p className="text-xs text-gray-500">Ajoute photo et vidéo de tes produits</p>
            <button onClick={()=>setShowForm(true)} className="bg-black text-white px-6 py-3 rounded-full font-black mt-4 text-sm">+ Publier mon 1er produit</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {produits.map(p=>(
              <div key={p.id} className="bg-white border rounded-xl overflow-hidden">
                <div className="relative"><img src={p.image_url} className="w-full h-[150px] object-cover" />{p.video_url && <span className="absolute top-1 left-1 bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded">VIDÉO</span>}<span className="absolute top-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded">★ {p.ville}</span></div>
                <div className="p-2"><p className="text-[11px] font-bold line-clamp-2 h-8">{p.titre}</p><p className="text-[12px] font-black text-orange-600">{Number(p.prix).toLocaleString()} F</p><p className="text-[9px] text-gray-500">{p.categorie}</p>
                  <div className="flex gap-1 mt-2"><button onClick={()=>editProduit(p)} className="flex-1 bg-gray-100 py-1.5 rounded-full text-[10px] font-bold">Modifier</button><button onClick={()=>supprimer(p.id)} className="flex-1 bg-red-50 text-red-600 py-1.5 rounded-full text-[10px] font-bold">Supprimer</button></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-[420px] rounded-t-[24px] md:rounded-[24px] p-5 max-h-[90vh] overflow-auto">
            <div className="flex justify-between"><p className="font-black">{editing ? "Modifier produit" : "Publier produit"}</p><button onClick={()=>setShowForm(false)} className="w-7 h-7 bg-gray-100 rounded-full">X</button></div>

            <div className="space-y-3 mt-4">
              <div><p className="text-[11px] font-bold">Titre produit *</p><input value={form.titre} onChange={e=>setForm({...form, titre:e.target.value})} placeholder="Ex: iPhone 13 Pro Max" className="w-full p-3 border rounded-xl text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[11px] font-bold">Prix (FCFA) *</p><input type="number" value={form.prix} onChange={e=>setForm({...form, prix:e.target.value})} placeholder="25000" className="w-full p-3 border rounded-xl text-sm" /></div>
                <div><p className="text-[11px] font-bold">Catégorie</p><select value={form.categorie} onChange={e=>setForm({...form, categorie:e.target.value})} className="w-full p-3 border rounded-xl text-sm"><option value="restaurant">Restaurant</option><option value="electronique">Électronique</option><option value="sports">Sports</option><option value="cosmetique">Cosmétique</option><option value="mode">Mode</option><option value="maison">Maison</option><option value="livres">Livres</option><option value="alimentation">Alimentation</option></select></div>
              </div>
              <div><p className="text-[11px] font-bold">Ville</p><select value={form.ville} onChange={e=>setForm({...form, ville:e.target.value})} className="w-full p-3 border rounded-xl text-sm"><option>Bamako</option><option>Kayes</option><option>Sikasso</option><option>Ségou</option><option>Mopti</option></select></div>

              <div><p className="text-[11px] font-bold">Photo produit *</p>
                <div className="mt-1 border-2 border-dashed rounded-xl p-3 text-center">
                  {form.image_url ? <img src={form.image_url} className="w-full h-32 object-cover rounded-xl" /> : <p className="text-xs text-gray-500">Aucune photo</p>}
                  <label className="inline-block mt-2 bg-black text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer"><input type="file" accept="image/*" onChange={e=>uploadFile(e,"image")} className="hidden" />{uploading ? "Chargement..." : "Choisir photo 📸"}</label>
                </div>
              </div>

              <div><p className="text-[11px] font-bold">Vidéo produit (optionnel mais recommandé pour Reels)</p>
                <div className="mt-1 border-2 border-dashed rounded-xl p-3 text-center">
                  {form.video_url ? <video src={form.video_url} className="w-full h-32 rounded-xl" controls /> : <p className="text-xs text-gray-500">Ajoute vidéo pour apparaître dans Reels 🎬</p>}
                  <label className="inline-block mt-2 bg-[#0a7a2e] text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer"><input type="file" accept="video/*" onChange={e=>uploadFile(e,"video")} className="hidden" />{uploading ? "Chargement..." : "Choisir vidéo 🎥"}</label>
                </div>
              </div>

              <div><p className="text-[11px] font-bold">Description</p><textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Détails, livraison, garantie..." className="w-full p-3 border rounded-xl text-sm h-20" /></div>

              <button onClick={saveProduit} className="w-full bg-black text-white py-4 rounded-full font-black">{editing ? "Enregistrer modifications" : "Publier sur MMMali →"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { generateAd, getSavedAds, getSingleAd, deleteAd, chatRefine } from "./api";

const AVATAR_STYLES = [
  { id: "professional", label: "Professional", emoji: "👔", desc: "Polished, business-ready" },
  { id: "relatable", label: "Relatable", emoji: "😊", desc: "Friendly, everyday person" },
  { id: "influencer", label: "Influencer", emoji: "✨", desc: "Trendy, social-media energy" },
  { id: "luxury", label: "Luxury", emoji: "💎", desc: "High-end, aspirational" },
];
const AD_FORMATS = [
  { id: "tiktok", label: "TikTok / Reels", duration: "15-30s", icon: "📱" },
  { id: "story", label: "Story Ad", duration: "5-15s", icon: "🔲" },
  { id: "youtube", label: "YouTube Pre-roll", duration: "15-60s", icon: "▶️" },
  { id: "facebook", label: "Facebook / IG Feed", duration: "30-60s", icon: "📘" },
];
const TONES = ["Energetic 🔥","Calm & Trustworthy 🤝","Luxury 💫","Funny 😂","Emotional 💛","Bold & Direct ⚡"];

function Spinner() {
  return <span style={{display:"inline-block",width:18,height:18,border:"2px solid #444",borderTopColor:"#f5c842",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />;
}

export default function App() {
  const [page,setPage]=useState("create");
  const [stage,setStage]=useState("input");
  const [product,setProduct]=useState("");
  const [audience,setAudience]=useState("");
  const [tone,setTone]=useState("Energetic 🔥");
  const [format,setFormat]=useState("tiktok");
  const [avatarStyle,setAvatarStyle]=useState("influencer");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState(null);
  const [activeTab,setActiveTab]=useState("concept");
  const [chatInput,setChatInput]=useState("");
  const [chatLog,setChatLog]=useState([]);
  const [chatLoading,setChatLoading]=useState(false);
  const [savedAds,setSavedAds]=useState([]);
  const [historyLoading,setHistoryLoading]=useState(false);
  const chatEndRef=useRef(null);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatLog]);
  const selectedFormat=AD_FORMATS.find(f=>f.id===format);

  async function generate(){
    if(!product.trim()||loading)return;
    setLoading(true);setError("");setResult(null);
    try{
      const data=await generateAd({product,audience,tone,format:selectedFormat.label+" ("+selectedFormat.duration+")",avatarStyle});
      setResult(data.result);
      setChatLog([{role:"ai",text:`Your ad for "${product}" is ready!`}]);
      setStage("done");setActiveTab("concept");
    }catch(e){setError(e.message);}
    setLoading(false);
  }

  async function loadHistory(){
    setHistoryLoading(true);
    try{const ads=await getSavedAds();setSavedAds(ads);}catch(e){setError(e.message);}
    setHistoryLoading(false);
  }

  async function loadAd(id){
    try{
      const ad=await getSingleAd(id);
      setProduct(ad.product);setAudience(ad.audience||"");setTone(ad.tone||"Energetic 🔥");
      setFormat(ad.format?.includes("TikTok")?"tiktok":ad.format?.includes("Story")?"story":ad.format?.includes("YouTube")?"youtube":"facebook");
      setAvatarStyle(ad.avatar_style||"influencer");setResult(ad.result);
      setChatLog([{role:"ai",text:`Loaded ad for "${ad.product}".`}]);
      setStage("done");setActiveTab("concept");setPage("create");
    }catch(e){setError(e.message);}
  }

  async function removeAd(id){
    try{await deleteAd(id);setSavedAds(p=>p.filter(a=>a.id!==id));}catch(e){setError(e.message);}
  }

  async function chat(){
    if(!chatInput.trim()||chatLoading)return;
    const msg=chatInput.trim();setChatInput("");
    setChatLog(p=>[...p,{role:"user",text:msg}]);setChatLoading(true);
    try{const reply=await chatRefine(product,result?.concept?.idea||"",msg);setChatLog(p=>[...p,{role:"ai",text:reply}]);}
    catch{setChatLog(p=>[...p,{role:"ai",text:"Error — try again."}]);}
    setChatLoading(false);
  }

  const tabs=[{id:"concept",label:"💡 Concept"},{id:"script",label:"📝 Script"},{id:"avatar",label:"🎭 Avatar"},{id:"board",label:"🎬 Storyboard"}];
  const card={background:"#111118",border:"1px solid #1e1e2e",borderRadius:14,padding:16,marginBottom:12};
  const lbl={fontSize:10,letterSpacing:2,color:"#f5c842",fontWeight:700,marginBottom:8};
  const inp={width:"100%",background:"#111118",border:"1px solid #252535",borderRadius:12,padding:"12px 14px",color:"#f0ede8",fontSize:14,fontFamily:"inherit"};

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      textarea:focus,input:focus{outline:none}
      ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
      body{background:#0a0a0f}
    `}</style>
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0ede8",fontFamily:"'DM Sans',sans-serif",paddingBottom:80}}>
      <div style={{background:"#0d0d14",borderBottom:"1px solid #1e1e2e",padding:"15px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:34,height:34,borderRadius:8,background:"linear-gradient(135deg,#f5c842,#ff6b35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:3,color:"#f5c842"}}>AI AD STUDIO</div>
            <div style={{fontSize:10,color:"#555",letterSpacing:1}}>CONCEPT · SCRIPT · AVATAR · STORYBOARD</div>
          </div>
        </div>
        <button onClick={()=>{setPage("history");loadHistory();}} style={{background:"#1a1a26",border:"1px solid #252535",borderRadius:9,padding:"7px 13px",color:"#888",fontSize:12,cursor:"pointer"}}>📁 Saved Ads</button>
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"0 14px"}}>

        {page==="history"&&(
          <div style={{animation:"fadeUp 0.35s ease"}}>
            <div style={{padding:"20px 0 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:2,color:"#f5c842"}}>SAVED ADS</div>
              <button onClick={()=>setPage("create")} style={{background:"#1a1a26",border:"1px solid #252535",borderRadius:9,padding:"7px 13px",color:"#888",fontSize:12,cursor:"pointer"}}>＋ New Ad</button>
            </div>
            {historyLoading&&<div style={{textAlign:"center",padding:40}}><Spinner/></div>}
            {!historyLoading&&savedAds.length===0&&<div style={{textAlign:"center",padding:60,color:"#555"}}><div style={{fontSize:40,marginBottom:12}}>📭</div><div>No saved ads yet!</div></div>}
            {savedAds.map(ad=>(
              <div key={ad.id} style={{...card,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div onClick={()=>loadAd(ad.id)} style={{flex:1,cursor:"pointer"}}>
                  <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{ad.product}</div>
                  <div style={{fontSize:12,color:"#555"}}>{ad.format} · {ad.tone?.split(" ")[0]}</div>
                  <div style={{fontSize:11,color:"#444",marginTop:2}}>{new Date(ad.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>loadAd(ad.id)} style={{background:"rgba(245,200,66,0.1)",border:"1px solid rgba(245,200,66,0.3)",borderRadius:8,padding:"6px 12px",color:"#f5c842",fontSize:12,cursor:"pointer"}}>Open</button>
                  <button onClick={()=>removeAd(ad.id)} style={{background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.2)",borderRadius:8,padding:"6px 10px",color:"#ff7777",fontSize:12,cursor:"pointer"}}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {page==="create"&&(
          <div>
            {stage==="input"&&(
              <div style={{animation:"fadeUp 0.35s ease"}}>
                <div style={{textAlign:"center",padding:"22px 0 14px"}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:3}}>CREATE YOUR AD</div>
                  <div style={{color:"#666",fontSize:13,marginTop:3}}>Describe your product — AI builds everything</div>
                </div>
                <div style={{marginBottom:13}}>
                  <div style={lbl}>PRODUCT / SERVICE *</div>
                  <textarea value={product} onChange={e=>setProduct(e.target.value)} rows={3}
                    placeholder="e.g. Uncle Tommy's Beard Oil — cedar & sandalwood, for men who want a clean masculine look..."
                    style={{...inp,resize:"none"}}
                    onFocus={e=>e.target.style.borderColor="#f5c842"} onBlur={e=>e.target.style.borderColor="#252535"}/>
                </div>
                <div style={{marginBottom:13}}>
                  <div style={lbl}>TARGET AUDIENCE</div>
                  <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="e.g. Black men 25-45 who care about grooming"
                    style={inp} onFocus={e=>e.target.style.borderColor="#f5c842"} onBlur={e=>e.target.style.borderColor="#252535"}/>
                </div>
                <div style={{marginBottom:13}}>
                  <div style={lbl}>AD FORMAT</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {AD_FORMATS.map(f=>(
                      <button key={f.id} onClick={()=>setFormat(f.id)} style={{background:format===f.id?"rgba(245,200,66,0.1)":"#111118",border:`1px solid ${format===f.id?"#f5c842":"#252535"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",color:format===f.id?"#f5c842":"#888",textAlign:"left"}}>
                        <div style={{fontSize:15,marginBottom:2}}>{f.icon}</div>
                        <div style={{fontSize:13,fontWeight:600}}>{f.label}</div>
                        <div style={{fontSize:11,opacity:0.6}}>{f.duration}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:13}}>
                  <div style={lbl}>TONE & VIBE</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {TONES.map(t=>(
                      <button key={t} onClick={()=>setTone(t)} style={{background:tone===t?"rgba(245,200,66,0.1)":"#111118",border:`1px solid ${tone===t?"#f5c842":"#252535"}`,borderRadius:20,padding:"6px 12px",cursor:"pointer",color:tone===t?"#f5c842":"#777",fontSize:13}}>{t}</button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={lbl}>AVATAR PRESENTER STYLE</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {AVATAR_STYLES.map(a=>(
                      <button key={a.id} onClick={()=>setAvatarStyle(a.id)} style={{background:avatarStyle===a.id?"rgba(245,200,66,0.1)":"#111118",border:`1px solid ${avatarStyle===a.id?"#f5c842":"#252535"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",color:avatarStyle===a.id?"#f5c842":"#888",textAlign:"left"}}>
                        <div style={{fontSize:17,marginBottom:2}}>{a.emoji}</div>
                        <div style={{fontSize:13,fontWeight:600}}>{a.label}</div>
                        <div style={{fontSize:11,opacity:0.6}}>{a.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {error&&<div style={{background:"rgba(255,70,70,0.08)",border:"1px solid rgba(255,70,70,0.3)",borderRadius:12,padding:"12px 14px",marginBottom:13,color:"#ff7777",fontSize:12,wordBreak:"break-word"}}>⚠️ {error}</div>}
                <button onClick={generate} disabled={!product.trim()||loading} style={{width:"100%",border:"none",borderRadius:13,padding:"16px",background:loading?"#1a1a26":product.trim()?"linear-gradient(135deg,#f5c842,#ff6b35)":"#1a1a26",color:loading||!product.trim()?"#555":"#0a0a0f",fontFamily:"'Bebas Neue'",fontSize:19,letterSpacing:3,cursor:product.trim()&&!loading?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                  {loading?<><Spinner/> GENERATING...</>:"⚡ GENERATE MY AD"}
                </button>
              </div>
            )}

            {stage==="done"&&result&&(
              <div style={{animation:"fadeUp 0.35s ease"}}>
                <div style={{padding:"14px 0 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2,color:"#f5c842"}}>AD READY ✓</div>
                    <div style={{fontSize:12,color:"#555"}}>{selectedFormat?.label}</div>
                  </div>
                  <button onClick={()=>{setStage("input");setResult(null);setChatLog([]);setError("");setProduct("");setAudience("");}} style={{background:"#1a1a26",border:"1px solid #252535",borderRadius:9,padding:"6px 12px",color:"#888",fontSize:12,cursor:"pointer"}}>＋ New Ad</button>
                </div>
                <div style={{display:"flex",gap:3,marginBottom:13,background:"#111118",borderRadius:11,padding:3}}>
                  {tabs.map(t=>(
                    <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,background:activeTab===t.id?"#1e1e32":"transparent",border:`1px solid ${activeTab===t.id?"#f5c842":"transparent"}`,borderRadius:8,padding:"8px 3px",cursor:"pointer",color:activeTab===t.id?"#f5c842":"#555",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>{t.label}</button>
                  ))}
                </div>

                {activeTab==="concept"&&result.concept&&(
                  <div>
                    <div style={card}><div style={lbl}>HOOK</div><div style={{fontFamily:"'Bebas Neue'",fontSize:21,lineHeight:1.3}}>{result.concept.hook}</div></div>
                    <div style={card}><div style={lbl}>CORE CONCEPT</div><div style={{fontSize:14,lineHeight:1.7,color:"#ccc"}}>{result.concept.idea}</div></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
                      <div style={{...card,marginBottom:0}}><div style={lbl}>EMOTION</div><div style={{fontSize:14,fontWeight:600}}>{result.concept.emotion}</div></div>
                      <div style={{...card,marginBottom:0}}><div style={lbl}>CTA</div><div style={{fontSize:14,fontWeight:600}}>{result.concept.cta}</div></div>
                    </div>
                    {result.concept.why&&<div style={{...card,marginTop:11,background:"rgba(245,200,66,0.04)",border:"1px solid rgba(245,200,66,0.15)"}}><div style={lbl}>WHY THIS WORKS</div><div style={{fontSize:13,color:"#999",lineHeight:1.6}}>{result.concept.why}</div></div>}
                  </div>
                )}

                {activeTab==="script"&&result.script&&(
                  <div>
                    <div style={{fontSize:12,color:"#555",marginBottom:9}}>Total: {result.script.duration}</div>
                    {(result.script.scenes||[]).map((sc,i)=>(
                      <div key={i} style={card}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
                          <div style={{fontSize:10,letterSpacing:2,color:"#f5c842",fontWeight:700}}>SCENE {i+1}</div>
                          <div style={{fontSize:11,color:"#555",background:"#1a1a26",padding:"2px 7px",borderRadius:5}}>{sc.time}</div>
                        </div>
                        {sc.visual&&<div style={{marginBottom:7}}><div style={{fontSize:10,color:"#555",marginBottom:2}}>📷 VISUAL</div><div style={{fontSize:13,color:"#ccc"}}>{sc.visual}</div></div>}
                        {sc.vo&&<div style={{background:"#0d0d18",borderRadius:9,padding:"9px 11px",marginBottom:7}}><div style={{fontSize:10,color:"#555",marginBottom:2}}>🎙️ VOICEOVER</div><div style={{fontSize:13,color:"#f0ede8",fontStyle:"italic",lineHeight:1.6}}>"{sc.vo}"</div></div>}
                        {sc.text&&<div style={{background:"rgba(245,200,66,0.08)",borderRadius:7,padding:"6px 10px",display:"inline-block"}}><div style={{fontSize:10,color:"#f5c842",marginBottom:1}}>TEXT OVERLAY</div><div style={{fontSize:13,fontWeight:700}}>{sc.text}</div></div>}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab==="avatar"&&result.avatar&&(
                  <div>
                    <div style={card}><div style={lbl}>AVATAR TYPE</div><div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{AVATAR_STYLES.find(a=>a.id===avatarStyle)?.emoji} {AVATAR_STYLES.find(a=>a.id===avatarStyle)?.label} Presenter</div><div style={{fontSize:12,color:"#555"}}>Paste into HeyGen, Synthesia, or D-ID</div></div>
                    {[["👤","APPEARANCE","look"],["👔","WARDROBE","wear"],["🎥","SETTING","place"],["🎙️","VOICE","voice"],["🤲","GESTURES","move"],["⚡","ENERGY","vibe"]].map(([icon,l,key])=>result.avatar[key]?(<div key={key} style={card}><div style={lbl}>{icon} {l}</div><div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{result.avatar[key]}</div></div>):null)}
                    <div style={{background:"rgba(255,107,53,0.05)",border:"1px solid rgba(255,107,53,0.2)",borderRadius:13,padding:15}}>
                      <div style={lbl}>🚀 PLATFORMS TO USE</div>
                      {[["HeyGen","Lifelike avatars + lip sync"],["Synthesia","Studio-quality presenters"],["D-ID","Photo → talking avatar (free tier)"],["Runway ML","Full video generation"]].map(([n,d])=>(
                        <div key={n} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1a1a26"}}>
                          <div style={{fontWeight:600,fontSize:13}}>{n}</div><div style={{color:"#555",fontSize:12}}>{d}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab==="board"&&result.board&&(
                  <div>
                    {(result.board.frames||[]).map((fr,i)=>(
                      <div key={i} style={{...card,display:"flex",gap:12}}>
                        <div style={{width:60,minWidth:60,height:60,background:"#16213e",borderRadius:9,border:"1px solid #252545",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:"#f5c842"}}>{fr.n||i+1}</div>
                          <div style={{fontSize:9,color:"#444"}}>{fr.ts}</div>
                        </div>
                        <div style={{flex:1}}>
                          {fr.shot&&<div style={{fontSize:10,color:"#f5c842",letterSpacing:1,marginBottom:3}}>{fr.shot.toUpperCase()} SHOT</div>}
                          <div style={{fontSize:13,color:"#ccc",lineHeight:1.5,marginBottom:5}}>{fr.desc}</div>
                          {fr.text&&<div style={{fontSize:11,background:"rgba(245,200,66,0.1)",color:"#f5c842",padding:"2px 7px",borderRadius:5,display:"inline-block",marginBottom:3}}>"{fr.text}"</div>}
                          {fr.cut&&<div style={{fontSize:11,color:"#444"}}>→ {fr.cut}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{marginTop:14,background:"#111118",border:"1px solid #1e1e2e",borderRadius:15,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a26",fontSize:11,color:"#555",letterSpacing:1}}>💬 REFINE — ask me to change anything</div>
                  {chatLog.length>0&&(
                    <div style={{padding:12,maxHeight:170,overflowY:"auto"}}>
                      {chatLog.map((m,i)=>(
                        <div key={i} style={{marginBottom:9,display:"flex",flexDirection:m.role==="user"?"row-reverse":"row",gap:7}}>
                          <div style={{maxWidth:"83%",borderRadius:11,padding:"8px 12px",fontSize:13,lineHeight:1.6,background:m.role==="user"?"rgba(245,200,66,0.1)":"#1a1a2a",border:`1px solid ${m.role==="user"?"rgba(245,200,66,0.25)":"#252535"}`,color:m.role==="user"?"#f5c842":"#ccc"}}>{m.text}</div>
                        </div>
                      ))}
                      {chatLoading&&<div style={{display:"flex"}}><div style={{background:"#1a1a2a",border:"1px solid #252535",borderRadius:11,padding:"9px 13px",color:"#555",fontSize:13}}>thinking...</div></div>}
                      <div ref={chatEndRef}/>
                    </div>
                  )}
                  <div style={{padding:"9px 12px",display:"flex",gap:7}}>
                    <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&chat()}
                      placeholder="Make it funnier... stronger CTA... add urgency..."
                      style={{flex:1,background:"#0d0d18",border:"1px solid #252535",borderRadius:9,padding:"9px 12px",color:"#f0ede8",fontSize:13,fontFamily:"inherit"}}/>
                    <button onClick={chat} disabled={chatLoading} style={{background:"linear-gradient(135deg,#f5c842,#ff6b35)",border:"none",borderRadius:9,width:38,cursor:"pointer",fontSize:15,opacity:chatLoading?0.5:1}}>→</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </>);
}

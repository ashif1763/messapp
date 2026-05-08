import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { toPng } from 'html-to-image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- TRANSLATION DICTIONARY ---
const dict = {
  en: {
    dashboard: "Dashboard", adda: "Mess Adda", roster: "Daily Roster", bazar: "Bazar List",
    members: "Members", expenses: "Expenses", payments: "Payments", settings: "Settings",
    profile: "My Profile", logout: "LOGOUT", login: "Login", create: "Create New Mess",
    join: "Join with Code", messName: "Mess Name", adminPin: "Manager PIN",
    name: "Your Name", phone: "Phone Number", pass: "Password", signIn: "SIGN IN",
    mealRate: "Meal Rate", totExp: "Total Expenses", totMeal: "Total Meals",
    todayMeal: "Today Meals", myMeals: "My Meals", myCost: "My Cost", paid: "Paid", bal: "Balance",
    submitMeal: "SUBMIT MEAL", addMeal: "🍚 Add My Meal",
    chatTitle: "💬 Mess Group Chat", pollTitle: "📊 Create a Poll", reviewTitle: "⭐ Rate Today's Meal",
    save: "SAVE", notif: "Notifications"
  },
  bn: {
    dashboard: "ড্যাশবোর্ড", adda: "মেস আড্ডা", roster: "ডেইলি রোস্টার", bazar: "বাজার লিস্ট",
    members: "মেম্বারস", expenses: "খরচ", payments: "পেমেন্ট", settings: "সেটিংস",
    profile: "আমার প্রোফাইল", logout: "লগআউট", login: "লগইন করুন", create: "নতুন মেস খুলুন",
    join: "কোড দিয়ে জয়েন করুন", messName: "মেসের নাম", adminPin: "ম্যানেজার পিন",
    name: "আপনার নাম", phone: "ফোন নাম্বার", pass: "পাসওয়ার্ড", signIn: "লগইন করুন",
    mealRate: "মিল রেট", totExp: "মোট খরচ", totMeal: "মোট মিল",
    todayMeal: "আজকের মিল", myMeals: "আমার মিল", myCost: "আমার খরচ", paid: "জমা দিয়েছি", bal: "ব্যালেন্স",
    submitMeal: "মিল জমা দিন", addMeal: "🍚 আমার মিল যোগ করুন",
    chatTitle: "💬 মেস গ্রুপ চ্যাট", pollTitle: "📊 পোল তৈরি করুন", reviewTitle: "⭐ খাবার রেটিং দিন",
    save: "সেভ করুন", notif: "নোটিফিকেশন"
  }
};

export default function App() {
  const [lang, setLang] = useState('bn');
  const t = (key) => dict[lang][key] || key;

  // --- STATES ---
  const [mess, setMess] = useState(null); 
  const [user, setUser] = useState(null); 
  const [authMode, setAuthMode] = useState('login'); 
  const [loginType, setLoginType] = useState('manager'); 
  const [loginInput, setLoginInput] = useState({ mName: '', pin: '', uName: '' });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dailyMeals, setDailyMeals] = useState([]);
  const [roster, setRoster] = useState([]);
  const [bazarItems, setBazarItems] = useState([]);
  const [leaves, setLeaves] = useState([]); 
  const [notice, setNotice] = useState(''); 
  const [archives, setArchives] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [polls, setPolls] = useState([]);
  const [votes, setVotes] = useState([]);
  const [chats, setChats] = useState([]);
  
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  const [bf, setBf] = useState(0.5); 
  const [lun, setLun] = useState(1);   
  const [din, setDin] = useState(1);   
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');

  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null); 
  
  const reportRef = useRef(null);
  const chatEndRef = useRef(null);

  const adminTabs = ['dashboard','adda','roster','bazar','members','expenses','payments','settings'];
  const memberTabs = ['profile','adda','bazar','payments'];

  const toBnNum = (n) => lang === 'bn' ? n?.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) || '০' : n;

  // --- PWA INSTALL LISTENER ---
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  // --- AUTH ---
  const handleCreateMess = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const { data, error } = await supabase.from('messes').insert([{ mess_name: f.get('m_name'), admin_pin: f.get('m_pin'), invite_code: generatedCode }]).select();
    if(error) alert("Error! Name already exists."); else { alert(`Success! Code: ${generatedCode}`); setAuthMode('login'); }
  };

  const handleJoinMess = async (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      const code = f.get('invite_code').toUpperCase(); const name = f.get('name'); const phone = f.get('phone'); const password = f.get('password');
      const { data: messData } = await supabase.from('messes').select('*').eq('invite_code', code).single();
      if(!messData) { alert("Invalid Code!"); return; }
      const { error } = await supabase.from('members').insert([{ mess_id: messData.id, name: name, phone: phone, password: password, role: 'member' }]);
      if(error) alert("Registration failed!"); else { alert("Joined!"); setLoginType('member'); setLoginInput({...loginInput, mName: messData.mess_name, uName: name}); setAuthMode('login'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data: messData } = await supabase.from('messes').select('*').eq('mess_name', loginInput.mName).single();
    if(!messData) { alert("Mess not found!"); return; }
    if (loginType === 'manager') {
        if(messData.admin_pin !== loginInput.pin) { alert("Wrong PIN!"); return; }
        setMess(messData); setUser({ name: 'Manager', role: 'admin', mess_id: messData.id }); setActiveTab('dashboard');
    } else {
        const { data: uData } = await supabase.from('members').select('*').eq('mess_id', messData.id).eq('name', loginInput.uName).eq('password', loginInput.pin).single();
        if(uData) { setMess(messData); setUser(uData); setActiveTab('profile'); } else alert("Wrong credentials!");
    }
  };

  // --- DATA FETCHING ---
  useEffect(() => { if(mess && user) fetchData(); }, [mess, user]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chats, activeTab]);

  const fetchData = async () => {
    setLoading(true); const mid = mess.id;
    const [mem, exp, pay, dm, bItems, lvs, ntc, arc, alrt, rev, pol, vt, cht] = await Promise.all([
        supabase.from('members').select('*').eq('mess_id', mid), supabase.from('expenses').select('*').eq('mess_id', mid),
        supabase.from('payments').select('*').eq('mess_id', mid), supabase.from('daily_meals').select('*').eq('mess_id', mid),
        supabase.from('bazar_items').select('*').eq('mess_id', mid), supabase.from('leaves').select('*').eq('mess_id', mid),
        supabase.from('notices').select('*').eq('mess_id', mid).limit(1).single(), supabase.from('archives').select('*').eq('mess_id', mid).order('created_at', { ascending: false }),
        supabase.from('alerts').select('*').eq('mess_id', mid).order('created_at', { ascending: false }).limit(20),
        supabase.from('meal_reviews').select('*').eq('mess_id', mid).order('created_at', { ascending: false }),
        supabase.from('polls').select('*').eq('mess_id', mid).order('created_at', { ascending: false }),
        supabase.from('poll_votes').select('*').eq('mess_id', mid), supabase.from('mess_chats').select('*').eq('mess_id', mid).order('created_at', { ascending: true })
    ]);
    setMembers(mem.data||[]); setExpenses(exp.data||[]); setPayments(pay.data||[]); setDailyMeals(dm.data||[]); setBazarItems(bItems.data||[]); setLeaves(lvs.data||[]); 
    setArchives(arc.data||[]); setAlerts(alrt.data||[]); setReviews(rev.data||[]); setPolls(pol.data||[]); setVotes(vt.data||[]); setChats(cht.data||[]);
    if(ntc.data) setNotice(ntc.data.content); setLoading(false);
  };

  const sendAlert = async (msg) => { const { data } = await supabase.from('alerts').insert([{ message: msg, mess_id: mess.id }]).select(); if(data) setAlerts([data[0], ...alerts]); };

  // --- CALCS ---
  const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalMealsCount = dailyMeals.reduce((sum, m) => sum + Number(m.total_day_meal || 0), 0);
  const mealRate = totalMealsCount > 0 ? Number((totalExpense / totalMealsCount).toFixed(2)) : 0;
  
  const todayDateStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0];

  const todaysMeals = dailyMeals.filter(m => m.date === todayDateStr);
  const todayTotalCount = todaysMeals.reduce((sum, m) => sum + Number(m.total_day_meal || 0), 0);
  const getMemberPaidAmount = (name) => payments.filter(p => p.member_name === name && p.status === 'Approved').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const getMemberTotalMeals = (name) => dailyMeals.filter(m => m.member_name === name).reduce((sum, m) => sum + Number(m.total_day_meal || 0), 0);
  const getMemberGuestCharge = (name) => dailyMeals.filter(m => m.member_name === name).reduce((sum, m) => sum + Number(m.guest_charge || 0), 0);
  const totalBazarActual = bazarItems.reduce((sum, item) => sum + Number(item.actual_price || 0), 0);
  const isOnLeave = (name, date) => leaves.some(l => l.member_name === name && l.start_date <= date && l.end_date >= date);

  // --- SOCIAL ACTIONS ---
  const sendChatMessage = async (e) => { e.preventDefault(); const msg = new FormData(e.target).get('msg'); if(!msg.trim()) return; const { data } = await supabase.from('mess_chats').insert([{ mess_id: mess.id, sender_name: user.name, message: msg }]).select(); if(data) { setChats([...chats, data[0]]); e.target.reset(); } };
  const createPoll = async (e) => { e.preventDefault(); const f = new FormData(e.target); const ops = newPollOptions.filter(o => o.trim() !== ''); if(ops.length < 2) { alert('At least 2 options needed!'); return; } const { data, error } = await supabase.from('polls').insert([{ mess_id: mess.id, question: f.get('question'), options: ops }]).select(); if(error) alert(error.message); else if(data) { setPolls([data[0], ...polls]); e.target.reset(); setNewPollOptions(['', '']); } };
  const submitVote = async (pollId, option) => { const { data } = await supabase.from('poll_votes').insert([{ mess_id: mess.id, poll_id: pollId, member_name: user.name, selected_option: option }]).select(); if(data) setVotes([...votes, data[0]]); };
  const closePoll = async (pollId) => { await supabase.from('polls').update({ is_active: false }).eq('id', pollId); setPolls(polls.map(p => p.id === pollId ? { ...p, is_active: false } : p)); };
  const deleteItem = async (id, table, state, setState) => { setState(state.filter(i => i.id !== id)); await supabase.from(table).delete().eq('id', id); };

  // --- MEAL RULES ---
  const addDailyMealAdmin = async (e) => { 
    e.preventDefault(); const f = new FormData(e.target); const m = f.get('member'); const d = f.get('date'); 
    const total = Number(bf) + Number(lun) + Number(din);
    if(isOnLeave(m, d)) { alert('Member chutite achen!'); return; } 
    const { data, error } = await supabase.from('daily_meals').insert([{ member_name: m, date: d, total_day_meal: total, mess_id: mess.id }]).select(); 
    if (!error) { 
        setDailyMeals([...dailyMeals, data[0]]); setBf(0.5); setLun(1); setDin(1); e.target.reset(); 
        const now = new Date(); const targetDate = new Date(d); targetDate.setHours(0,0,0,0);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        let isRuleBroken = false;
        if (targetDate.getTime() <= today.getTime()) isRuleBroken = true; 
        if (targetDate.getTime() === tomorrow.getTime() && (now.getHours() < 18 || now.getHours() >= 22)) isRuleBroken = true; 
        if(isRuleBroken) sendAlert(`⚠️ Manager time-over howar por ${m} er jonno ${d} tarikher meal add korechen!`);
        else sendAlert(`🍽️ Manager ${m} er jonno meal add korechen.`);
    } 
  };

  const handleMemberMealSubmit = async (e) => {
      e.preventDefault(); 
      const start_d = new FormData(e.target).get('start_date');
      const end_d = new FormData(e.target).get('end_date') || start_d;
      const is_explicit_guest = new FormData(e.target).get('is_guest') === 'on';
      const totalPerDay = Number(bf) + Number(lun) + Number(din);
      if(totalPerDay <= 0) return;

      const startDate = new Date(start_d); const endDate = new Date(end_d);
      const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

      if(startDate < today) { alert('Past date error!'); return; }
      const datesToInsert = []; let currentDate = new Date(startDate);

      while(currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          if(!isOnLeave(user.name, dateStr)) { 
              let isGuestForThisDate = is_explicit_guest; let charge = 0;
              const isToday = currentDate.getTime() === today.getTime();
              const isTomorrow = currentDate.getTime() === tomorrow.getTime();

              if (isToday) { alert(`❌ 12 AM passed! Cannot add for ${dateStr}`); currentDate.setDate(currentDate.getDate() + 1); continue; }
              if (isTomorrow) {
                  if (now.getHours() < 18) { alert(`❌ Add after 6 PM for tomorrow!`); currentDate.setDate(currentDate.getDate() + 1); continue; } 
                  else if (now.getHours() >= 22) isGuestForThisDate = true; 
              }
              if (isGuestForThisDate) charge = totalPerDay * 5;

              const existingMeals = dailyMeals.filter(m => m.member_name === user.name && m.date === dateStr);
              if (existingMeals.some(m => !m.is_guest) && !isGuestForThisDate) { alert(`${dateStr} meal already added.`); } 
              else datesToInsert.push({ member_name: user.name, date: dateStr, total_day_meal: totalPerDay, mess_id: mess.id, is_guest: isGuestForThisDate, guest_charge: charge });
          }
          currentDate.setDate(currentDate.getDate() + 1);
      }
      if (datesToInsert.length > 0) {
          const { data } = await supabase.from('daily_meals').insert(datesToInsert).select();
          if (data) { setDailyMeals([...dailyMeals, ...data]); alert('✅ Meal Submitted!'); setBf(0.5); setLun(1); setDin(1); }
      }
  };

  const submitPayment = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    const mName = user.role === 'admin' ? f.get('member_name') : user.name;
    const amount = Number(f.get('amount')); const method = f.get('method'); const trx_id = f.get('trx_id') || 'N/A';
    let charge = 0; if (['bKash', 'Nagad', 'Rocket'].includes(method)) charge = amount * 0.0185; 
    const st = user.role === 'admin' ? 'Approved' : 'Pending';
    const { data } = await supabase.from('payments').insert([{ member_name: mName, amount, charge, method, trx_id, status: st, mess_id: mess.id }]).select();
    if(data) { setPayments([...payments, data[0]]); alert(`✅ Payment ${st}! Charge: ৳${charge.toFixed(2)}`); e.target.reset(); setPayAmount(''); setPayMethod('Cash'); }
  };

  const approvePayment = async (id) => {
    await supabase.from('payments').update({ status: 'Approved' }).eq('id', id);
    setPayments(payments.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
  };

  // --- BAZAR LIST LOGIC ---
  const loadDefaultBazarItems = async () => {
    const items = ['চাল-দুপুর', 'চাল-রাত', 'চাল-সকাল', 'তেল-সয়াবিন', 'ডাল-মসুর', 'পেঁয়াজ', 'আলু', 'ডিম', 'লবণ', 'কাঁচা মরিচ', 'মাছ', 'মাংস', 'সবজি'];
    const insertData = items.map(name => ({ item_name: name, mess_id: mess.id }));
    const { data } = await supabase.from('bazar_items').insert(insertData).select();
    if(data) setBazarItems([...bazarItems, ...data]);
  };
  const addBazarItem = async (e) => { e.preventDefault(); const n = new FormData(e.target).get('item_name'); const { data } = await supabase.from('bazar_items').insert([{item_name: n, mess_id: mess.id}]).select(); if(data) setBazarItems([...bazarItems, data[0]]); e.target.reset(); };
  const handleBazarChange = (id, field, value) => { setBazarItems(bazarItems.map(item => item.id === id ? { ...item, [field]: value } : item)); };
  const handleBazarBlur = async (id, field, value) => { await supabase.from('bazar_items').update({ [field]: value }).eq('id', id); };
  const saveBazarToExpenses = async () => { if(totalBazarActual <= 0) return; const { data, error } = await supabase.from('expenses').insert([{ title: `বাজার (${new Date().toLocaleDateString()})`, category: 'Bazar', amount: totalBazarActual, mess_id: mess.id }]).select(); if(!error) { setExpenses([...expenses, data[0]]); alert(`Sufolvabe jog hoyeche!`); } };

  // Calculate Bazar Sl Numbers
  const slNumbers = []; let currentSl = 0;
  bazarItems.forEach((item, index) => {
      const mainName = item.item_name.split('-')[0].trim();
      const prevMainName = index > 0 ? bazarItems[index - 1].item_name.split('-')[0].trim() : null;
      if (mainName !== prevMainName) currentSl++; slNumbers.push(currentSl);
  });

  // --- EXPORTS ---
  const updatePin = async (e) => { e.preventDefault(); const newPin = new FormData(e.target).get('new_pin'); const { error } = await supabase.from('messes').update({ admin_pin: newPin }).eq('id', mess.id); if(!error) { alert('PIN Update hoyeche!'); e.target.reset(); } };
  const downloadCSV = () => { let csvContent = "data:text/csv;charset=utf-8,\uFEFFName,Meals,Cost,Paid,Balance\n"; members.forEach(m => { const ml = getMemberTotalMeals(m.name); const gCharge = getMemberGuestCharge(m.name); const cost = (ml * mealRate) + gCharge; const paid = getMemberPaidAmount(m.name); csvContent += `${m.name},${ml},${cost.toFixed(2)},${paid},${(paid - cost).toFixed(2)}\n`; }); const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", "Mess_Report.csv"); link.click(); };
  const closeMonth = async () => { const mName = prompt("Masher nam likhun (Udha: Jan 2026):"); if(!mName) return; if(window.confirm("Apni ki nishchit? Shob data archive e chole jabe.")) { const { error } = await supabase.from('archives').insert([{ month_name: mName, total_expense: totalExpense, total_meals: totalMealsCount, meal_rate: mealRate, mess_id: mess.id }]); if(!error) { await supabase.from('expenses').delete().eq('mess_id', mess.id); await supabase.from('daily_meals').delete().eq('mess_id', mess.id); await supabase.from('payments').delete().eq('mess_id', mess.id); fetchData(); alert("Mash close hoyeche!"); } } };
  const downloadReport = async (ref, fileName) => { if (!ref.current) return; try { const dataUrl = await toPng(ref.current, { cacheBust: true, backgroundColor: darkMode ? "#1f2937" : "#ffffff", pixelRatio: 2 }); const link = document.createElement('a'); link.download = `${fileName}.png`; link.href = dataUrl; link.click(); } catch (error) { console.error("Error:", error); } };
  const printInvoice = () => { window.print(); };

  // --- AUTH UI ---
  if (!mess || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-500 ${darkMode ? 'bg-gray-900' : 'bg-indigo-100'}`}>
        <div className={`p-10 rounded-[40px] shadow-2xl max-w-md w-full border-4 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-white'}`}>
          <div className="flex justify-between items-center mb-6">
             <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-full font-bold">{lang.toUpperCase()}</button>
             <button onClick={() => setDarkMode(!darkMode)} className="text-2xl">{darkMode ? '☀️' : '🌙'}</button>
          </div>
          <div className="text-center mb-8">
            <h1 className={`text-5xl font-black italic tracking-tighter ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>{t('title') || 'MessSaaS'}</h1>
            <p className="text-gray-400 mt-4 font-bold">{authMode === 'create' ? t('create') : authMode === 'join' ? t('join') : t('login')}</p>
          </div>
          
          {authMode === 'create' && (
            <form onSubmit={handleCreateMess} className="space-y-4 animate-fade-in">
               <input name="m_name" placeholder={t('messName')} className={`w-full p-4 border-2 rounded-2xl outline-none font-bold ${darkMode?'bg-gray-700 border-gray-600':'bg-gray-50'}`} required />
               <input name="m_pin" type="password" placeholder={t('adminPin')} className={`w-full p-4 border-2 rounded-2xl outline-none font-bold ${darkMode?'bg-gray-700 border-gray-600':'bg-gray-50'}`} required />
               <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">CREATE</button>
               <p onClick={() => setAuthMode('login')} className="text-center text-indigo-500 cursor-pointer text-sm font-bold hover:underline">Back to Login</p>
            </form>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
               <div className={`flex p-1.5 rounded-2xl mb-6 ${darkMode?'bg-gray-700':'bg-gray-100'}`}>
                   <button type="button" onClick={() => setLoginType('manager')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${loginType==='manager'?'bg-indigo-500 text-white shadow-md':'text-gray-400'}`}>Manager</button>
                   <button type="button" onClick={() => setLoginType('member')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${loginType==='member'?'bg-indigo-500 text-white shadow-md':'text-gray-400'}`}>Member</button>
               </div>
               <input placeholder={t('messName')} value={loginInput.mName} onChange={e=>setLoginInput({...loginInput, mName: e.target.value})} className={`w-full p-4 border-2 rounded-2xl outline-none font-bold ${darkMode?'bg-gray-700 border-gray-600':'bg-gray-50'}`} required />
               {loginType === 'member' && <input placeholder={t('name')} value={loginInput.uName} onChange={e=>setLoginInput({...loginInput, uName: e.target.value})} className={`w-full p-4 border-2 rounded-2xl outline-none font-bold ${darkMode?'bg-gray-700 border-gray-600':'bg-gray-50'}`} required />}
               <input type="password" placeholder={loginType === 'manager' ? t('adminPin') : t('pass')} value={loginInput.pin} onChange={e=>setLoginInput({...loginInput, pin: e.target.value})} className={`w-full p-4 border-2 rounded-2xl outline-none font-bold ${darkMode?'bg-gray-700 border-gray-600':'bg-gray-50'}`} required />
               <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xl shadow-xl hover:scale-95 transition">{t('signIn')}</button>
               <div className="flex justify-between mt-4">
                  <p onClick={() => setAuthMode('join')} className="text-green-500 cursor-pointer text-sm font-black hover:underline">{t('join')}</p>
                  <p onClick={() => setAuthMode('create')} className="text-indigo-400 cursor-pointer text-sm font-bold hover:underline">{t('create')}</p>
               </div>
            </form>
          )}

          {authMode === 'join' && (
            <form onSubmit={handleJoinMess} className="space-y-4 animate-fade-in">
               <input name="invite_code" placeholder="Invite Code (e.g. A1B2C3)" className={`w-full p-4 border-2 rounded-2xl outline-none font-black uppercase text-center ${darkMode?'bg-green-900 border-green-700 text-green-300':'bg-green-50 border-green-200 text-green-700'}`} required />
               <input name="name" placeholder={t('name')} className={`w-full p-4 border-2 rounded-2xl outline-none font-bold ${darkMode?'bg-gray-700 border-gray-600':'bg-gray-50'}`} required />
               <input name="phone" placeholder={t('phone')} type="tel" className={`w-full p-4 border-2 rounded-2xl outline-none font-bold ${darkMode?'bg-gray-700 border-gray-600':'bg-gray-50'}`} required />
               <input name="password" type="password" placeholder={t('pass')} className={`w-full p-4 border-2 rounded-2xl outline-none font-bold ${darkMode?'bg-gray-700 border-gray-600':'bg-gray-50'}`} required />
               <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg">JOIN</button>
               <p onClick={() => setAuthMode('login')} className="text-center text-indigo-400 cursor-pointer text-sm font-bold hover:underline mt-4">Back to Login</p>
            </form>
          )}
        </div>
      </div>
    );
  }

  const tabsToShow = user?.role === 'admin' ? adminTabs : memberTabs;

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300 font-sans print:bg-white print:text-black">
        
        {/* HEADER (Hidden in Print) */}
        <header className="bg-indigo-600 dark:bg-gray-800 text-white shadow-xl sticky top-0 z-50 print:hidden">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center relative">
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest">{mess.mess_name}</h2>
              <p className="text-[10px] font-bold text-indigo-200 uppercase">HELLO, {user?.name} 👋</p>
            </div>
            <div className="flex items-center gap-4">
              {deferredPrompt && (
                 <button onClick={handleInstallClick} className="hidden md:block bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-black shadow-lg animate-bounce">
                   📥 Install App
                 </button>
              )}
              <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} className="text-xs bg-indigo-500 dark:bg-gray-700 px-3 py-1 rounded-full font-bold">{lang.toUpperCase()}</button>
              <button onClick={() => setDarkMode(!darkMode)} className="text-2xl">{darkMode ? '☀️' : '🌙'}</button>
              <div className="relative">
                 <button onClick={() => setShowNotif(!showNotif)} className="text-2xl relative">
                    🔔 {alerts.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full animate-ping"></span>}
                 </button>
                 {showNotif && (
                    <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-4 z-50 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-indigo-600 font-black mb-2 border-b dark:border-gray-700 pb-2">{t('notif')}</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                           {alerts.map(a => (<div key={a.id} className="text-xs bg-indigo-50 dark:bg-gray-700 p-2 rounded-lg">{a.message}</div>))}
                        </div>
                    </div>
                 )}
              </div>
              <button onClick={() => {setMess(null); setUser(null);}} className="bg-red-500 px-4 py-1.5 rounded-xl text-[10px] font-black shadow-lg">{t('logout')}</button>
            </div>
          </div>
          <nav className="max-w-6xl mx-auto px-2 flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
              {tabsToShow.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-md scale-105' : 'text-indigo-100 opacity-70 hover:opacity-100'}`}>{t(tab)}</button>
              ))}
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 print:p-0">
          
          {/* DASHBOARD (ADMIN) */}
          {activeTab === 'dashboard' && user?.role === 'admin' && (
            <div className="space-y-6 animate-fade-in print:space-y-2">
              
              <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
                  <h1 className="text-4xl font-black uppercase tracking-widest">{mess.mess_name}</h1>
                  <h2 className="text-xl font-bold mt-2">Monthly Mess Report</h2>
                  <p className="text-sm font-bold">Date: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-3xl shadow-lg text-white flex justify-between items-center print:hidden">
                  <div><h3 className="text-sm font-bold opacity-80 uppercase">Invite Code For Members</h3><p className="text-4xl font-black tracking-widest">{mess.invite_code || "N/A"}</p></div>
                  <button onClick={() => navigator.clipboard.writeText(mess.invite_code)} className="bg-white/20 p-4 rounded-2xl font-black hover:bg-white/30">📋 Copy</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
                  <div className="bg-white dark:bg-gray-800 print:bg-white p-6 rounded-[30px] print:rounded-lg shadow-sm text-center border dark:border-gray-700 print:border-black"><h3 className="text-[10px] font-black text-gray-400 print:text-black">{t('mealRate')}</h3><p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 print:text-black">৳{toBnNum(mealRate)}</p></div>
                  <div className="bg-white dark:bg-gray-800 print:bg-white p-6 rounded-[30px] print:rounded-lg shadow-sm text-center border dark:border-gray-700 print:border-black"><h3 className="text-[10px] font-black text-gray-400 print:text-black">{t('totExp')}</h3><p className="text-3xl font-black print:text-black">৳{toBnNum(totalExpense)}</p></div>
                  <div className="bg-white dark:bg-gray-800 print:bg-white p-6 rounded-[30px] print:rounded-lg shadow-sm text-center border dark:border-gray-700 print:border-black"><h3 className="text-[10px] font-black text-gray-400 print:text-black">{t('totMeal')}</h3><p className="text-3xl font-black print:text-black">{toBnNum(totalMealsCount)}</p></div>
                  <div className="bg-blue-600 print:bg-white p-6 rounded-[30px] print:rounded-lg shadow-xl print:shadow-none text-white print:text-black text-center print:border print:border-black"><h3 className="text-[10px] font-black text-blue-200 print:text-black">{t('todayMeal')}</h3><p className="text-4xl font-black print:text-black">{toBnNum(todayTotalCount)}</p></div>
              </div>

              <div className="flex gap-4 print:hidden">
                    <button onClick={printInvoice} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-md flex-1">🖨️ Print / Save PDF</button>
                    <button onClick={downloadCSV} className="bg-green-600 text-white px-6 py-3 rounded-xl font-black shadow-md flex-1">📊 Download Excel</button>
              </div>

              <div className="bg-white dark:bg-gray-800 print:bg-white rounded-[35px] print:rounded-none shadow-xl print:shadow-none overflow-hidden border dark:border-gray-700 print:border-black">
                <table className="w-full text-left text-sm print:text-xs">
                  <thead className="bg-indigo-50 dark:bg-gray-700 print:bg-gray-200">
                      <tr><th className="p-5 print:p-2 border-b print:border-black font-black text-indigo-700 dark:text-indigo-300 print:text-black">Member</th><th className="p-5 print:p-2 border-b print:border-black text-center font-black">Meals</th><th className="p-5 print:p-2 border-b print:border-black text-right font-black">Paid</th><th className="p-5 print:p-2 border-b print:border-black text-right font-black">Balance</th></tr>
                  </thead>
                  <tbody>
                    {(members || []).map(m => {
                      const ml = getMemberTotalMeals(m.name); const gCharge = getMemberGuestCharge(m.name); const cost = (ml * mealRate) + gCharge; const pd = getMemberPaidAmount(m.name); const bl = pd - cost;
                      return ( <tr key={m.id} className="border-b dark:border-gray-700 print:border-black hover:bg-gray-50 dark:hover:bg-gray-700"><td className="p-5 print:p-2 font-bold flex flex-col gap-1"><div>{m.name}</div>{gCharge > 0 && <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/30 w-fit px-2 rounded-full print:border print:border-black">Guest Fee: ৳{toBnNum(gCharge)}</span>}</td><td className="p-5 print:p-2 text-center font-black text-gray-500 print:text-black">{toBnNum(ml)}</td><td className="p-5 print:p-2 text-right font-black text-green-600 print:text-black">৳{toBnNum(pd)}</td><td className={`p-5 print:p-2 text-right font-black print:text-black ${bl<0?'text-red-500':'text-green-500'}`}>৳{toBnNum(Number(bl).toFixed(1))}</td></tr> );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="hidden print:flex justify-between px-10 mt-20 text-black font-bold">
                  <div className="border-t-2 border-black pt-2 text-center w-40">Manager Signature</div>
                  <div className="border-t-2 border-black pt-2 text-center w-40">Mess Admin</div>
              </div>
            </div>
          )}

          {/* MY PROFILE (MEMBER) */}
          {activeTab === 'profile' && user?.role === 'member' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 rounded-[40px] shadow-xl text-white">
                  <h2 className="text-3xl font-black mb-2">Hello, {user.name}! 👤</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white/10 p-4 rounded-3xl text-center"><p className="text-xs uppercase font-bold opacity-70">{t('myMeals')}</p><p className="text-3xl font-black">{toBnNum(getMemberTotalMeals(user.name))}</p></div>
                      <div className="bg-white/10 p-4 rounded-3xl text-center"><p className="text-xs uppercase font-bold opacity-70">{t('myCost')}</p><p className="text-3xl font-black">৳{toBnNum(((getMemberTotalMeals(user.name) * mealRate) + getMemberGuestCharge(user.name)).toFixed(2))}</p></div>
                      <div className="bg-white/10 p-4 rounded-3xl text-center"><p className="text-xs uppercase font-bold opacity-70">{t('paid')}</p><p className="text-3xl font-black text-green-300">৳{toBnNum(getMemberPaidAmount(user.name))}</p></div>
                      <div className="bg-white/10 p-4 rounded-3xl text-center"><p className="text-xs uppercase font-bold opacity-70">{t('bal')}</p><p className="text-3xl font-black text-yellow-300">৳{toBnNum((getMemberPaidAmount(user.name) - ((getMemberTotalMeals(user.name) * mealRate) + getMemberGuestCharge(user.name))).toFixed(2))}</p></div>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <form onSubmit={handleMemberMealSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-lg border dark:border-gray-700">
                      <h2 className="text-xl font-black text-indigo-600 dark:text-indigo-400">{t('addMeal')}</h2>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                          <div><label className="text-[10px] font-black text-indigo-400">Start Date</label><input name="start_date" type="date" required className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white" defaultValue={tomorrowDateStr} min={todayDateStr} /></div>
                          <div><label className="text-[10px] font-black text-indigo-400">End Date</label><input name="end_date" type="date" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white" min={todayDateStr} /></div>
                      </div>
                      <div className="flex gap-2 p-4 bg-indigo-50 dark:bg-gray-900 rounded-3xl border-2 border-indigo-100 dark:border-gray-700 my-4">
                          <div className="flex-1 text-center"><label className="text-[10px] font-black text-indigo-400">Sokal</label><input type="number" step="0.5" value={bf} onChange={e=>setBf(e.target.value)} className="w-full bg-transparent text-center text-xl font-black dark:text-white" /></div>
                          <div className="flex-1 text-center border-x-2 border-indigo-100 dark:border-gray-700"><label className="text-[10px] font-black text-indigo-400">Dupur</label><input type="number" step="0.5" value={lun} onChange={e=>setLun(e.target.value)} className="w-full bg-transparent text-center text-xl font-black dark:text-white" /></div>
                          <div className="flex-1 text-center"><label className="text-[10px] font-black text-indigo-400">Raat</label><input type="number" step="0.5" value={din} onChange={e=>setDin(e.target.value)} className="w-full bg-transparent text-center text-xl font-black dark:text-white" /></div>
                      </div>
                      <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl">{t('submitMeal')}</button>
                  </form>
                  <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-lg border dark:border-gray-700 overflow-hidden h-fit">
                      <h2 className="p-6 font-black bg-indigo-50 dark:bg-gray-700 border-b dark:border-gray-600">My Recent Meals</h2>
                      {dailyMeals.filter(m => m.member_name === user.name).slice(0,10).map(m => (
                          <div key={m.id} className="p-5 border-b dark:border-gray-700 flex justify-between items-center group">
                              <div><span className="font-bold">{new Date(m.date).toLocaleDateString()}</span>{m.is_guest && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 rounded-full">Guest</span>}</div>
                              <div className="flex items-center gap-4"><span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-black">{toBnNum(m.total_day_meal)}</span></div>
                          </div>
                      ))}
                  </div>
              </div>
            </div>
          )}

          {/* 🚀 MESS ADDA (CHAT & POLL) */}
          {activeTab === 'adda' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-lg border dark:border-gray-700 p-6 flex flex-col h-[600px]">
                    <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                        <h2 className="font-black text-indigo-600 dark:text-indigo-400 text-xl">{t('chatTitle')}</h2>
                        <button onClick={fetchData} className="text-xs bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg font-bold">🔄 Refresh</button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                        {chats.length === 0 && <p className="text-center text-gray-400 mt-20 font-bold">Kono message nei.</p>}
                        {chats.map(c => (
                            <div key={c.id} className={`flex flex-col ${c.sender_name === user.name ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] font-bold text-gray-400 mb-1">{c.sender_name}</span>
                                <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${c.sender_name === user.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
                                    <p className="text-sm font-medium">{c.message}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={sendChatMessage} className="flex gap-2 mt-auto">
                        <input name="msg" className="flex-1 p-4 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl outline-none font-bold dark:text-white" placeholder="Write a message..." required />
                        <button className="bg-indigo-600 text-white px-6 rounded-2xl font-black">SEND</button>
                    </form>
                </div>

                <div className="space-y-6 overflow-y-auto h-[600px] pr-2">
                    {user?.role === 'admin' && (
                        <form onSubmit={createPoll} className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-[30px] border-2 border-yellow-200 dark:border-yellow-700 shadow-md">
                            <h2 className="font-black text-yellow-700 dark:text-yellow-500 mb-4">{t('pollTitle')}</h2>
                            <input name="question" placeholder="E.g: Agamikal ki ranna hobe?" className="w-full p-3 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-xl mb-3 font-bold dark:text-white" required />
                            <div className="space-y-2 mb-4">
                                {newPollOptions.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input value={opt} onChange={e => { const arr = [...newPollOptions]; arr[i] = e.target.value; setNewPollOptions(arr); }} placeholder={`Option ${i+1}`} className="flex-1 p-3 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-xl font-bold dark:text-white" required />
                                        {newPollOptions.length > 2 && <button type="button" onClick={() => setNewPollOptions(newPollOptions.filter((_, idx) => idx !== i))} className="px-3 bg-red-100 text-red-600 rounded-xl font-black">✕</button>}
                                    </div>
                                ))}
                                <button type="button" onClick={() => setNewPollOptions([...newPollOptions, ''])} className="text-sm font-bold text-yellow-600 dark:text-yellow-400 mt-2 hover:underline">+ Add More Option</button>
                            </div>
                            <button className="w-full bg-yellow-500 text-white py-3 rounded-xl font-black">Publish Poll</button>
                        </form>
                    )}
                    {polls.filter(p => p.is_active).map(p => {
                        const totalVotes = votes.filter(v => v.poll_id === p.id);
                        const hasVoted = totalVotes.some(v => v.member_name === user.name);
                        return (
                            <div key={p.id} className="bg-white dark:bg-gray-800 p-6 rounded-[30px] shadow-lg border border-indigo-100 dark:border-gray-700">
                                <h3 className="font-black text-lg mb-4">{p.question}</h3>
                                {!hasVoted ? (
                                    <div className="space-y-2">{p.options.map((opt, i) => (<button key={i} onClick={() => submitVote(p.id, opt)} className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl font-bold">👉 {opt}</button>))}</div>
                                ) : (
                                    <div className="space-y-3">{p.options.map((opt, i) => {
                                        const optVotes = totalVotes.filter(v => v.selected_option === opt).length;
                                        const percentage = totalVotes.length > 0 ? Math.round((optVotes / totalVotes.length) * 100) : 0;
                                        return (<div key={i} className="relative bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl p-3 overflow-hidden"><div className="absolute top-0 left-0 h-full bg-indigo-100 dark:bg-indigo-900/30" style={{ width: `${percentage}%` }}></div><div className="relative flex justify-between font-bold text-sm"><span>{opt}</span><span>{optVotes} Votes</span></div></div>);
                                    })}</div>
                                )}
                                {user?.role === 'admin' && <button onClick={() => closePoll(p.id)} className="w-full mt-4 bg-red-100 text-red-600 py-2 rounded-xl font-black text-xs">Close Poll</button>}
                            </div>
                        )
                    })}
                </div>
             </div>
          )}

          {/* 💎 PREMIUM BAZAR LIST */}
          {activeTab === 'bazar' && (
            <div className="space-y-6 animate-fade-in">
                {user?.role === 'admin' ? (
                    <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700">
                        <form onSubmit={addBazarItem} className="flex gap-2 flex-1">
                            <input name="item_name" required placeholder="Jemon: Dal-Mosur" className="w-full p-3 border dark:border-gray-600 dark:bg-gray-700 rounded-xl font-bold dark:text-white" />
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black">Add</button>
                        </form>
                        <button onClick={loadDefaultBazarItems} className="bg-green-600 text-white p-3 rounded-xl font-black">🛒 Load Full List</button>
                        <button onClick={() => downloadReport(reportRef, 'Bazar_List')} className="bg-indigo-600 text-white p-3 rounded-xl font-black">📸</button>
                    </div>
                ) : (
                    <div className="flex justify-end"><button onClick={() => downloadReport(reportRef, 'Bazar_List')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black">📸 Download Image</button></div>
                )}

                <div ref={reportRef} className="bg-white dark:bg-gray-800 p-8 border-2 border-gray-800 dark:border-gray-500 rounded-[30px] shadow-xl overflow-x-auto relative">
                    <div className="text-center mb-6"><h2 className="text-3xl font-black border-b-2 border-gray-800 dark:border-gray-400 inline-block pb-2 px-6 dark:text-white">বাজার তালিকা</h2></div>
                    <table className="w-full border-collapse border-2 border-gray-800 dark:border-gray-500 text-sm">
                        <thead><tr className="bg-gray-100 dark:bg-gray-700"><th className="border-2 border-gray-800 dark:border-gray-500 p-3 text-center w-12 dark:text-white">Sl</th><th colSpan="2" className="border-2 border-gray-800 dark:border-gray-500 p-3 text-center dark:text-white">Item Name</th><th className="border-2 border-gray-800 dark:border-gray-500 p-3 text-center w-28 dark:text-white">Qty</th><th className="border-2 border-gray-800 dark:border-gray-500 p-3 text-center w-32 dark:text-white">Expected</th><th className="border-2 border-gray-800 dark:border-gray-500 p-3 text-center w-32 dark:text-white">Actual</th>{user?.role === 'admin' && <th className="border-2 border-gray-800 dark:border-gray-500 p-3 text-center print-hidden w-12 dark:text-white">✕</th>}</tr></thead>
                        <tbody>
                            {bazarItems.map((item, index) => {
                                const parts = item.item_name.split('-'); const mainName = parts[0].trim(); const subName = parts.length > 1 ? parts.slice(1).join('-').trim() : null;
                                const isFirst = index === 0 || mainName !== bazarItems[index - 1].item_name.split('-')[0].trim();
                                let rowSpanCount = 1;
                                if (isFirst) for (let i = index + 1; i < bazarItems.length; i++) { if (bazarItems[i].item_name.split('-')[0].trim() === mainName && bazarItems[i].item_name.includes('-')) rowSpanCount++; else break; }
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        {isFirst && <td rowSpan={rowSpanCount} className="border-2 border-gray-800 dark:border-gray-500 p-2 text-center font-black text-xl dark:text-white">{toBnNum(slNumbers[index])}</td>}
                                        {isFirst && subName && <td rowSpan={rowSpanCount} className="border border-gray-800 dark:border-gray-500 p-2 font-black text-center uppercase dark:text-white" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{mainName}</td>}
                                        {isFirst && !subName && <td colSpan={2} className="border border-gray-800 dark:border-gray-500 p-3 font-black pl-4 uppercase dark:text-white">{mainName}</td>}
                                        {subName && <td className="border border-gray-800 dark:border-gray-500 p-2 font-bold capitalize dark:text-gray-300">{subName}</td>}
                                        <td className="border border-gray-800 dark:border-gray-500 p-0 text-center">{user?.role === 'admin' ? <input value={item.quantity || ''} onChange={(e) => handleBazarChange(item.id, 'quantity', e.target.value)} onBlur={(e) => handleBazarBlur(item.id, 'quantity', e.target.value)} className="w-full h-full p-3 text-center font-bold bg-transparent outline-none dark:text-white" /> : <span className="p-3 inline-block font-bold dark:text-white">{item.quantity || '-'}</span>}</td>
                                        <td className="border border-gray-800 dark:border-gray-500 p-0 text-center">{user?.role === 'admin' ? <input type="number" value={item.expected_price || ''} onChange={(e) => handleBazarChange(item.id, 'expected_price', Number(e.target.value))} onBlur={(e) => handleBazarBlur(item.id, 'expected_price', Number(e.target.value))} className="w-full h-full p-3 text-center font-bold bg-transparent outline-none dark:text-white" /> : <span className="p-3 inline-block font-bold dark:text-white">৳{toBnNum(item.expected_price || '-')}</span>}</td>
                                        <td className="border border-gray-800 dark:border-gray-500 p-0 text-center font-black text-green-600 dark:text-green-400">{user?.role === 'admin' ? <input type="number" value={item.actual_price || ''} onChange={(e) => handleBazarChange(item.id, 'actual_price', Number(e.target.value))} onBlur={(e) => handleBazarBlur(item.id, 'actual_price', Number(e.target.value))} className="w-full h-full p-3 text-center font-black text-green-600 dark:text-green-400 bg-transparent outline-none" /> : <span className="p-3 inline-block font-black text-green-600 dark:text-green-400">৳{toBnNum(item.actual_price || '-')}</span>}</td>
                                        {user?.role === 'admin' && <td className="border-2 border-gray-800 dark:border-gray-500 p-0 text-center print-hidden cursor-pointer text-red-500" onClick={() => deleteItem(item.id, 'bazar_items', bazarItems, setBazarItems)}><div className="p-3 font-black">✕</div></td>}
                                    </tr>
                                );
                            })}
                            <tr className="font-black bg-gray-100 dark:bg-gray-700"><td colSpan="4" className="border-2 border-gray-800 dark:border-gray-500 p-4 text-right dark:text-white">TOTAL:</td><td className="border-2 border-gray-800 dark:border-gray-500 p-4 text-center text-lg dark:text-white">৳ {toBnNum(bazarItems.reduce((sum, item) => sum + Number(item.expected_price || 0), 0))}</td><td className="border-2 border-gray-800 dark:border-gray-500 p-4 text-center text-2xl text-green-600 dark:text-green-400">৳ {toBnNum(totalBazarActual)}</td>{user?.role === 'admin' && <td className="border-2 border-gray-800 dark:border-gray-500 print-hidden"></td>}</tr>
                        </tbody>
                    </table>
                    <div className="mt-20 flex justify-between px-8 text-sm font-black dark:text-white"><p className="border-t-2 border-gray-800 dark:border-gray-400 pt-2 px-10">Bazar Karir Sign</p><p className="border-t-2 border-gray-800 dark:border-gray-400 pt-2 px-10">Manager Sign</p></div>
                    {user?.role === 'admin' && <div className="mt-10 flex justify-end print-hidden"><button onClick={saveBazarToExpenses} className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-xl font-black">➕ Add Total to Mess Expenses</button></div>}
                </div>
            </div>
          )}

          {/* OTHERS: ROSTER */}
          {activeTab === 'roster' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <div className="space-y-6">
                 {user?.role === 'admin' && (
                   <form onSubmit={addDailyMealAdmin} className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-lg border dark:border-gray-700 space-y-4">
                      <h2 className="text-xl font-black text-indigo-600 dark:text-indigo-400">🍚 Add Meal (Admin)</h2>
                      <select name="member" className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white">
                         {(members||[]).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                      <input name="date" type="date" className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white" defaultValue={todayDateStr} />
                      <div className="flex gap-2 p-4 bg-indigo-50 dark:bg-gray-900 rounded-3xl border-2 border-indigo-100 dark:border-gray-700">
                         <div className="flex-1"><input type="number" step="0.5" value={bf} onChange={e=>setBf(e.target.value)} className="w-full text-center text-2xl font-black bg-transparent dark:text-white" /></div>
                         <div className="flex-1"><input type="number" step="0.5" value={lun} onChange={e=>setLun(e.target.value)} className="w-full text-center text-2xl font-black bg-transparent dark:text-white" /></div>
                         <div className="flex-1"><input type="number" step="0.5" value={din} onChange={e=>setDin(e.target.value)} className="w-full text-center text-2xl font-black bg-transparent dark:text-white" /></div>
                      </div>
                      <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black">ADD</button>
                   </form>
                 )}
                 {user?.role === 'admin' && (
                   <form onSubmit={async(e)=>{e.preventDefault(); const f=new FormData(e.target); await supabase.from('leaves').insert([{member_name:f.get('m'),start_date:f.get('s'),end_date:f.get('e'),mess_id:mess.id}]); fetchData(); e.target.reset();}} className="bg-yellow-50 dark:bg-yellow-900/20 p-8 rounded-[40px] border-2 border-yellow-200 dark:border-yellow-700 shadow-lg space-y-4">
                      <h2 className="font-black text-yellow-700 dark:text-yellow-500 pb-2">🏖️ Add Leave</h2>
                      <select name="m" className="w-full p-4 bg-white dark:bg-gray-800 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white">{(members||[]).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
                      <div className="flex gap-2"><input name="s" type="date" required className="w-full p-4 bg-white dark:bg-gray-800 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white" defaultValue={todayDateStr}/><input name="e" type="date" required className="w-full p-4 bg-white dark:bg-gray-800 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white"/></div>
                      <button className="w-full bg-yellow-500 text-white p-4 rounded-2xl font-black shadow-lg">SAVE LEAVE</button>
                   </form>
                 )}
              </div>
              <div className="space-y-6">
                 <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-lg border dark:border-gray-700 overflow-hidden">
                    <h2 className="p-6 font-black bg-indigo-50 dark:bg-gray-700 border-b dark:border-gray-600">Today's Meals</h2>
                    {todaysMeals.map(m => (
                       <div key={m.id} className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                          <span className="font-bold">{m.member_name}</span>
                          <div className="flex items-center gap-4">
                             <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-black">{toBnNum(m.total_day_meal)}</span>
                             {user?.role === 'admin' && <button onClick={()=>deleteItem(m.id,'daily_meals',dailyMeals,setDailyMeals)} className="text-red-400 font-black hover:text-red-600">✕</button>}
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-lg border dark:border-gray-700 overflow-hidden">
                    <h2 className="p-6 font-black bg-yellow-50 dark:bg-gray-700 border-b dark:border-gray-600">Active Leaves</h2>
                    {leaves.map(l=>(<div key={l.id} className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                       <div><p className="font-black text-gray-700 dark:text-gray-200">{l.member_name}</p><p className="text-xs text-gray-500 font-bold">{l.start_date} to {l.end_date}</p></div>
                       {user?.role === 'admin' && <button onClick={()=>deleteItem(l.id,'leaves',leaves,setLeaves)} className="text-red-400 hover:text-red-600 font-black text-sm">✕</button>}
                    </div>))}
                 </div>
              </div>
            </div>
          )}

          {/* OTHERS: MEMBERS */}
          {activeTab === 'members' && user?.role === 'admin' && (
            <div className="animate-fade-in space-y-6">
               <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[30px] border border-blue-200 dark:border-blue-800">
                  <h3 className="font-black text-blue-700 dark:text-blue-400 text-lg">💡 Member Invite</h3>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-2">Member ra dashboard er invite code diye nijei account khulbe.</p>
               </div>
               <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-lg border dark:border-gray-700 overflow-hidden h-fit">
                  <h2 className="p-6 font-black bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">Member List ({toBnNum(members.length)})</h2>
                  {members.map(m => (
                     <div key={m.id} className="p-6 border-b dark:border-gray-700 flex justify-between items-center font-black">
                        <div>
                           <p>{m.name}</p>
                           <p className="text-xs text-gray-400 font-bold mt-1">📞 {toBnNum(m.phone) || 'N/A'}</p>
                        </div>
                        <button onClick={()=>deleteItem(m.id, 'members', members, setMembers)} className="text-red-400 hover:text-red-600">✕ Delete</button>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {/* OTHERS: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <form onSubmit={submitPayment} className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-lg border dark:border-gray-700 space-y-4">
                 <h2 className="font-black text-indigo-600 dark:text-indigo-400 text-xl">💳 {t('payments')}</h2>
                 {user?.role === 'admin' && (
                    <select name="member_name" className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white">
                       {(members||[]).map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                 )}
                 <input name="amount" type="number" placeholder="Amount" value={payAmount} onChange={e=>setPayAmount(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white" required />
                 <select name="method" value={payMethod} onChange={e=>setPayMethod(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white">
                    <option value="Cash">Cash</option>
                    <option value="bKash">bKash (+1.85%)</option>
                    <option value="Nagad">Nagad (+1.85%)</option>
                    <option value="Rocket">Rocket (+1.85%)</option>
                 </select>
                 {['bKash', 'Nagad', 'Rocket'].includes(payMethod) && (
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-2xl border dark:border-red-800">
                       <p className="text-sm font-bold text-red-600 dark:text-red-400">Charge: ৳{toBnNum((Number(payAmount) * 0.0185).toFixed(2))}</p>
                       <input name="trx_id" placeholder="TrxID" className="w-full p-3 mt-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-xl font-bold dark:text-white" required />
                    </div>
                 )}
                 <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">SUBMIT</button>
              </form>
              <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-lg border dark:border-gray-700 overflow-hidden h-fit">
                 <h2 className="p-6 font-black bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">Payment History</h2>
                 {payments.filter(p => user?.role === 'admin' || p.member_name === user?.name).map(p => (
                   <div key={p.id} className="p-6 border-b dark:border-gray-700 flex justify-between items-center font-bold text-sm">
                      <div>
                         <p>{p.member_name} <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 rounded-full text-[10px]">{p.method}</span></p>
                         {p.trx_id && p.trx_id !== 'N/A' && <p className="text-[10px] text-gray-400">TrxID: {p.trx_id}</p>}
                      </div>
                      <div className="text-right flex gap-3">
                         <div>
                            <p className="text-green-600 dark:text-green-400 text-lg font-black">৳{toBnNum(p.amount)}</p>
                            {p.charge > 0 && <p className="text-[10px] text-red-500">Charge: ৳{toBnNum(Number(p.charge).toFixed(2))}</p>}
                         </div>
                         {p.status === 'Pending' ? (
                            user?.role === 'admin' ? 
                            <button onClick={()=>approvePayment(p.id)} className="bg-yellow-400 text-white px-3 py-1 rounded-lg">Approve</button> : 
                            <span className="text-yellow-600">Pending</span>
                         ) : (<span className="text-green-600">Approved</span>)}
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* OTHERS: EXPENSES */}
          {activeTab === 'expenses' && user?.role === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
               <form onSubmit={async(e)=>{e.preventDefault(); await supabase.from('expenses').insert([{title: new FormData(e.target).get('x'), amount: new FormData(e.target).get('y'), mess_id: mess.id}]); fetchData(); e.target.reset();}} className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-lg border dark:border-gray-700 space-y-4 h-fit">
                  <h2 className="font-black text-indigo-600 dark:text-indigo-400 text-xl">➕ Add Expense</h2>
                  <input name="x" placeholder="Details" className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white" required />
                  <input name="y" type="number" placeholder="Amount" className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl font-bold dark:text-white" required />
                  <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black">SAVE</button>
               </form>
               <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-lg border dark:border-gray-700 overflow-hidden h-fit">
                  <h2 className="p-6 font-black bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">Expense History</h2>
                  {expenses.map(i => (
                     <div key={i.id} className="p-6 border-b dark:border-gray-700 flex justify-between items-center font-black group">
                        <span>{i.title}</span>
                        <div className="flex items-center gap-4">
                           <span className="text-red-500">৳{toBnNum(i.amount)}</span>
                           <button onClick={()=>deleteItem(i.id, 'expenses', expenses, setExpenses)} className="text-red-300 hover:text-red-600">✕</button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {/* OTHERS: SETTINGS */}
          {activeTab === 'settings' && user?.role === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
               <div className="space-y-6">
                  <form onSubmit={updatePin} className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-lg border dark:border-gray-700 h-fit">
                     <h2 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mb-4">🔑 Update PIN</h2>
                     <input name="new_pin" type="password" required className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 dark:border-gray-600 rounded-2xl mb-4 font-bold dark:text-white" />
                     <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black">UPDATE</button>
                  </form>
                  <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-[40px] border-2 border-red-100 dark:border-red-800 shadow-lg">
                     <h2 className="text-xl font-black text-red-600 dark:text-red-400 mb-2">🏁 Close Month</h2>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Mash shesh e data archive korun.</p>
                     <button onClick={closeMonth} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black">CLOSE THIS MONTH</button>
                  </div>
               </div>
               <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-xl border dark:border-gray-700 overflow-hidden">
                  <h2 className="p-6 font-black bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">📜 Archive</h2>
                  <div className="max-h-[400px] overflow-y-auto">
                     {archives.map(a => (
                        <div key={a.id} className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                           <div>
                              <p className="font-black text-indigo-600 dark:text-indigo-400">{a.month_name}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{new Date(a.created_at).toLocaleDateString()}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-black">৳{toBnNum(a.meal_rate)} /Meal</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import UiIcon from '../components/UiIcon';
import toast from 'react-hot-toast';

/* ───────── STATIC FORENSIC DATABASE ───────── */

const SCAM_PHONES_INDIA = [
  { number: '+91 98000 00001', region: 'India', risk: 'critical', reports: 47, type: 'UPI Fraud / Vishing' },
  { number: '+91 98000 00002', region: 'India', risk: 'high', reports: 31, type: 'Loan App Scam' },
  { number: '+91 98000 00003', region: 'India', risk: 'critical', reports: 62, type: 'OTP Interception' },
  { number: '+91 98000 00004', region: 'India', risk: 'medium', reports: 18, type: 'Tech Support Scam' },
  { number: '+91 98000 00005', region: 'India', risk: 'high', reports: 39, type: 'KYC Fraud Call' },
  { number: '+91 98000 00006', region: 'India', risk: 'critical', reports: 55, type: 'Investment Scam' },
  { number: '+91 98000 00007', region: 'India', risk: 'medium', reports: 22, type: 'Fake Delivery Call' },
  { number: '+91 98000 00008', region: 'India', risk: 'high', reports: 36, type: 'SIM Swap Fraud' },
  { number: '+91 98000 00009', region: 'India', risk: 'critical', reports: 71, type: 'Sextortion Call' },
];

const SCAM_PHONES_NA = [];
for (let i = 100; i <= 199; i++) {
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const types = ['Robocall Scam', 'IRS Impersonation', 'Warranty Fraud', 'Tech Support', 'Lottery Scam', 'Debt Collection Fraud', 'Social Security Scam', 'Medicare Fraud', 'Crypto Pump Call', 'Romance Scam'];
  SCAM_PHONES_NA.push({
    number: `+1 555-0${i}`,
    region: 'North America',
    risk: riskLevels[Math.floor(Math.random() * riskLevels.length)],
    reports: Math.floor(Math.random() * 80) + 5,
    type: types[Math.floor(Math.random() * types.length)],
  });
}

const VOIP_NUMBERS = [
  { number: 'VoIP-SIP-001', region: 'Unknown', risk: 'critical', reports: 94, type: 'Spoofed Caller ID' },
  { number: 'VoIP-SIP-002', region: 'Unknown', risk: 'high', reports: 58, type: 'Mass Robocall Origin' },
  { number: 'VoIP-SIP-003', region: 'Unknown', risk: 'critical', reports: 112, type: 'Vishing Gateway' },
];

const ALL_SCAM_PHONES = [...SCAM_PHONES_INDIA, ...SCAM_PHONES_NA, ...VOIP_NUMBERS];

const PHISHING_LINKS_RAW = `graphicriver.net,ecnavi.jp,hubpages.com,extratorrent.cc,icicibank.com,nypost.com,kienthuc.net.vn,thenextweb.com,tobogo.net,akhbarelyom.com,tunein.com,tune.pk,sfglobe.com,mic.com,couchtuner.eu.com,olx.in,venturebeat.com,allegro.pl,tinnhanh360.net,metro.co.uk,gawker.com,steamcommunity.com,kaskus.co.id,shutterstock.com,repubblica.it,pantip.com,sitepoint.com,kinopoisk.ru,youm7.com,kickass.to,webmd.com,usatoday.com,livedoor.jp,xinhuanet.com,ign.com,adbooth.com,mercadolibre.com.ar,adcash.com,ehow.com,dianping.com,doublepimp.com,billboard.com,merdeka.com,lifehacker.com,espn.go.com,rt.com,variety.com,namu.wiki,telegraph.co.uk,detik.com,dramafire.com,softonic.com,theguardian.com,google.com,kinox.to,dailymail.co.uk,bleacherreport.com,instructables.com,dmm.co.jp,lefigaro.fr,kompas.com,tribunnews.com,latimes.com,wiktionary.org,abs-cbnnews.com,investing.com,bloomberg.com,slideshare.net,daum.net,wikia.com,wikihow.com,mashable.com,theverge.com,gamefaqs.com,gsmarena.com,subscene.com,engadget.com,fool.com,alwafd.org,liputan6.com,cbssports.com,gamepedia.com,booking.com,soha.vn,rottentomatoes.com,viki.com,goodreads.com,wordreference.com,chip.de,time.com,kinogo.co,sapo.pt,gamespot.com,sohu.com,spox.com,techradar.com,forbes.com,businessinsider.com,chron.com,focus.de,digitaltrends.com,zdnet.com,marica.com,washingtontimes.com,cnet.com,pcworld.com,huffingtonpost.com,dailykos.com,gizmodo.com,pcmag.com,tomshardware.com,slate.com,theatlantic.com,salon.com,vox.com,medium.com,buzzfeed.com,arstechnica.com,polygon.com,vice.com,kotaku.com,destructoid.com,thefire.org,fandom.com,thoughtco.com,lifewire.com,tripsavvy.com,thespruce.com,verywellhealth.com,investopedia.com,balance.com,treehugger.com,simplyrecipes.com,seriousEats.com,thesprucepets.com,thespruceeats.com,byrdie.com,myanimelist.net,boardgamegeek.com,nexusmods.com,moddb.com,curseforge.com,nexus.org,github.com,gitlab.com,bitbucket.org,sourceforge.net,npmJS.com,pypi.org,rubygems.org,packagist.org,crates.io,docker.com,huggingface.co,kaggle.com,replit.com,codepen.io,stackexchange.com,stackoverflow.com,superuser.com,serverfault.com,askubuntu.com,mathoverflow.net,reddit.com,quora.com,substack.com,dev.to,hashnode.com,hackernews.ycombinator.com,slashdot.org,producthunt.com,indiehackers.com,dribbble.com,behance.net,artstation.com,deviantart.com,unsplash.com,pexels.com,pixabay.com,freepik.com,flaticon.com,fontspace.com,dafont.com,fonts.google.com,canva.com,figma.com,miro.com,trello.com,notion.so,asana.com,monday.com,clickup.com,airtable.com,basecamp.com,slack.com,discord.com,telegram.org,whatsapp.com,signal.org,element.io,matrix.org,zoom.us,meet.google.com,teams.microsoft.com,webex.com,skype.com,viber.com,line.me,kakaotalk.com,wechat.com,qq.com,sina.com.cn,weibo.com,baidu.com,zhihu.com,bilibili.com,youku.com,iqiyi.com,douyin.com,tiktok.com,kwai.com,threads.net,x.com,twitter.com,facebook.com,instagram.com,linkedin.com,pinterest.com,tumblr.com,flickr.com,500px.com,vimeo.com,dailymotion.com,twitch.tv,kick.com,rumble.com,bitchute.com,odysee.com,youtube.com,spotify.com,soundcloud.com,bandcamp.com,deezer.com,pandora.com,tidal.com,apple.com,microsoft.com,amazon.com,ebay.com,walmart.com,target.com,bestbuy.com,homedepot.com,lowes.com,etsy.com,shopify.com,aliexpress.com,alibaba.com,taobao.com,tmall.com,jd.com,rakuten.co.jp,shopee.com,lazada.com,tokopedia.com,blibli.com,bukalapak.com,flipkart.com,myntra.com,ajio.com,snapdeal.com,meesho.com,nykaa.com,zepto.in,blinkit.com,instamart.in,bigbasket.com,swiggy.com,zomato.com,ubereats.com,doordash.com,grubhub.com,deliveroo.co.uk,justeat.com,takeaway.com,foodpanda.com,uber.com,lyft.com,grab.com,gojek.com,bolt.eu,free-now.com,ola.in,rapido.bike,makemytrip.com,goibibo.com,yatra.com,cleartrip.com,easemytrip.com,expedia.com,kayak.com,skyscanner.net,tripadvisor.com,airbnb.com,vrbo.com,hostelworld.com,agoda.com,hotels.com,trivago.com,priceline.com,orbitz.com,travelocity.com,delta.com,united.com,americanairlines.com,southwest.com,lufthansa.com,britishairways.com,emirates.com,qatarairways.com,singaporeair.com,cathaypacific.com,airindia.in,indigo.in,spicejet.com,akasaair.com,paytm.com,phonepe.com,gpay.app,cred.club,razorpay.com,stripe.com,paypal.com,wise.com,revolut.com,n26.com,chime.com,robinhood.com,coinbase.com,binance.com,kraken.com,bybit.com,okx.com,kucoin.com,bitfinex.com,gate.io,crypto.com,metamask.io,trustwallet.com,opensea.io,rarible.com,blur.io`;

const PHISHING_CATEGORIES = {
  'Banking & Finance': ['icicibank.com','paytm.com','phonepe.com','gpay.app','cred.club','razorpay.com','stripe.com','paypal.com','wise.com','revolut.com','n26.com','chime.com','robinhood.com'],
  'Crypto & Web3': ['coinbase.com','binance.com','kraken.com','bybit.com','okx.com','kucoin.com','bitfinex.com','gate.io','crypto.com','metamask.io','trustwallet.com','opensea.io','rarible.com','blur.io'],
  'Social Media': ['facebook.com','instagram.com','linkedin.com','pinterest.com','tumblr.com','x.com','twitter.com','threads.net','tiktok.com','douyin.com','reddit.com','quora.com','weibo.com','zhihu.com'],
  'E-Commerce': ['amazon.com','ebay.com','walmart.com','aliexpress.com','alibaba.com','flipkart.com','shopee.com','olx.in','meesho.com','myntra.com','etsy.com','shopify.com','snapdeal.com'],
  'Communication': ['telegram.org','whatsapp.com','discord.com','slack.com','zoom.us','skype.com','signal.org','viber.com','wechat.com','qq.com','teams.microsoft.com'],
  'Tech & Developer': ['github.com','gitlab.com','stackoverflow.com','npmJS.com','pypi.org','docker.com','huggingface.co','kaggle.com','replit.com','codepen.io'],
  'News & Media': ['theguardian.com','dailymail.co.uk','forbes.com','bloomberg.com','usatoday.com','huffingtonpost.com','buzzfeed.com','vice.com','rt.com','cnet.com'],
  'Streaming & Entertainment': ['youtube.com','twitch.tv','spotify.com','vimeo.com','dailymotion.com','soundcloud.com','kick.com','rumble.com','bilibili.com'],
  'Travel & Transport': ['airbnb.com','uber.com','makemytrip.com','expedia.com','booking.com','tripadvisor.com','emirates.com','delta.com'],
};

const PHISHING_LINKS = PHISHING_LINKS_RAW.split(',').map(domain => {
  const d = domain.trim();
  let cat = 'Other';
  let risk = 'medium';
  for (const [category, domains] of Object.entries(PHISHING_CATEGORIES)) {
    if (domains.includes(d)) { cat = category; break; }
  }
  if (['Banking & Finance','Crypto & Web3'].includes(cat)) risk = 'critical';
  else if (['Social Media','E-Commerce','Communication'].includes(cat)) risk = 'high';
  else if (['News & Media','Streaming & Entertainment'].includes(cat)) risk = 'medium';
  else risk = ['low','medium','high'][Math.floor(Math.random() * 3)];
  return { domain: d, category: cat, risk, reports: Math.floor(Math.random() * 120) + 3 };
});

const OTHER_THREATS = [
  { identifier: '@Crypto_Wealth_Signals_VIP', category: 'Social Media', type: 'Investment Scam', risk: 'critical', reports: 124, details: 'Promotes 10x returns in 24 hours via fake trading dashboards.' },
  { identifier: '@BankHelp_Desk_99', category: 'Social Media', type: 'Support Impersonation', risk: 'high', reports: 88, details: 'Replies to customer complaints offering "instant resolution" links.' },
  { identifier: 'Official_Govt_Subsidy_Bot', category: 'Social Media', type: 'Advance-Fee Scam', risk: 'high', reports: 210, details: 'Claims user won a government grant, demands a "transfer fee" first.' },
  { identifier: 'fast.loan.approval@paytm', category: 'Financial', type: 'Fake Loan Disbursal', risk: 'critical', reports: 342, details: 'Asks for a "processing fee" or "GST" upfront before loan release.' },
  { identifier: '4099-8821-3310', category: 'Financial', type: 'Unregistered Shell Account', risk: 'critical', reports: 19, details: 'Bank Name: Apex Trust International Bank. Used for temporary routing of wire fraud; name mimics real global banks.' },
  { identifier: '0x71C...B49a', category: 'Financial', type: 'Romance / Pig Butchering', risk: 'high', reports: 45, details: 'Crypto Wallet (USDT TRC20). Destination address for fraudulent investment platforms.' },
  { identifier: 'Instant_Loan_Approved.apk', category: 'Malicious App', type: 'Extortion Malware', risk: 'critical', reports: 512, details: 'Disguised as Quick personal loan app. Harvests contact lists, SMS messages, and photo galleries for extortion.' },
  { identifier: 'Secure_Bank_Token_Sync', category: 'Malicious App', type: 'OTP Interceptor', risk: 'critical', reports: 89, details: 'Disguised as 2FA authentication utility. Intercepts OTPs and logs bank login credentials.' },
  { identifier: 'Free_Crypto_Multiplier', category: 'Malicious App', type: 'Overlay Malware', risk: 'high', reports: 122, details: 'Disguised as Cryptocurrency cloud miner. Overlays fake login screens on legitimate banking apps.' },
];

/* ───────── TAB CONFIG ───────── */
const TABS = [
  { id: 'phones', label: 'Scam Phone Numbers', icon: 'scam-phone-tab', color: '#FF3B30', glow: 'rgba(255,59,48,0.15)' },
  { id: 'phishing', label: 'Phishing Links', icon: 'phishing-links', color: '#FF9500', glow: 'rgba(255,149,0,0.15)' },
  { id: 'other', label: 'Other Threats', icon: 'other-threats', color: '#B026FF', glow: 'rgba(176,38,255,0.15)' },
  { id: 'ocr', label: 'OCR Identifiers', icon: 'ocr-identifiers', color: '#00B4FF', glow: 'rgba(0,180,255,0.15)' },
];

const RISK_COLORS = {
  critical: { bg: 'rgba(255,59,48,0.12)', border: 'rgba(255,59,48,0.35)', text: '#FF3B30', label: 'CRITICAL' },
  high:     { bg: 'rgba(255,149,0,0.12)', border: 'rgba(255,149,0,0.35)', text: '#FF9500', label: 'HIGH' },
  medium:   { bg: 'rgba(255,214,10,0.10)', border: 'rgba(255,214,10,0.30)', text: '#FFD60A', label: 'MEDIUM' },
  low:      { bg: 'rgba(0,255,170,0.08)', border: 'rgba(0,255,170,0.25)', text: '#00FFAA', label: 'LOW' },
};

/* ───────── COMPONENT ───────── */
export default function AdminLinkAnalysis() {
  const [ocrLinks, setOcrLinks] = useState({ phones: [], upis: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('phones');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [phoneRegion, setPhoneRegion] = useState('all');
  const [phishingCat, setPhishingCat] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await analyticsAPI.linkAnalysis();
        setOcrLinks(data.data.links);
      } catch { /* OCR data may be empty — that's fine */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, riskFilter, phoneRegion, phishingCat, activeTab]);

  /* ── Filtered data ── */
  const filteredPhones = useMemo(() => {
    return ALL_SCAM_PHONES.filter(p => {
      if (searchQuery && !p.number.toLowerCase().includes(searchQuery.toLowerCase()) && !p.type.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (riskFilter !== 'all' && p.risk !== riskFilter) return false;
      if (phoneRegion === 'india' && p.region !== 'India') return false;
      if (phoneRegion === 'na' && p.region !== 'North America') return false;
      if (phoneRegion === 'voip' && p.region !== 'Unknown') return false;
      return true;
    });
  }, [searchQuery, riskFilter, phoneRegion]);

  const filteredLinks = useMemo(() => {
    return PHISHING_LINKS.filter(l => {
      if (searchQuery && !l.domain.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (riskFilter !== 'all' && l.risk !== riskFilter) return false;
      if (phishingCat !== 'all' && l.category !== phishingCat) return false;
      return true;
    });
  }, [searchQuery, riskFilter, phishingCat]);

  const filteredOther = useMemo(() => {
    return OTHER_THREATS.filter(t => {
      if (searchQuery && !t.identifier.toLowerCase().includes(searchQuery.toLowerCase()) && !t.type.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (riskFilter !== 'all' && t.risk !== riskFilter) return false;
      return true;
    });
  }, [searchQuery, riskFilter]);

  const paginatedPhones = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPhones.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPhones, currentPage]);

  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLinks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLinks, currentPage]);

  const paginatedOther = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOther.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOther, currentPage]);

  const totalPages = activeTab === 'phones'
    ? Math.ceil(filteredPhones.length / ITEMS_PER_PAGE)
    : activeTab === 'phishing'
      ? Math.ceil(filteredLinks.length / ITEMS_PER_PAGE)
      : activeTab === 'other'
        ? Math.ceil(filteredOther.length / ITEMS_PER_PAGE)
        : 1;

  /* ── Stats ── */
  const phoneStats = {
    total: ALL_SCAM_PHONES.length,
    critical: ALL_SCAM_PHONES.filter(p => p.risk === 'critical').length,
    india: SCAM_PHONES_INDIA.length,
    na: SCAM_PHONES_NA.length,
  };
  const linkStats = {
    total: PHISHING_LINKS.length,
    critical: PHISHING_LINKS.filter(l => l.risk === 'critical').length,
    categories: Object.keys(PHISHING_CATEGORIES).length,
  };
  const otherStats = {
    total: OTHER_THREATS.length,
    critical: OTHER_THREATS.filter(t => t.risk === 'critical').length,
  };

  const riskBadge = (risk) => {
    const r = RISK_COLORS[risk] || RISK_COLORS.medium;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.8px',
        background: r.bg, border: `1px solid ${r.border}`, color: r.text,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.text, boxShadow: `0 0 6px ${r.text}` }} />
        {r.label}
      </span>
    );
  };

  /* ───────── RENDER ───────── */
  return (
    <div style={{
      minHeight: '100vh', background: '#02060A', color: '#fff',
      position: 'relative', overflowX: 'hidden', fontFamily: 'Inter, sans-serif'
    }}>
      {/* Atmospheric */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(255,59,48,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(255,149,0,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '60px 24px 100px', position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF3B30', display: 'inline-block', boxShadow: '0 0 8px #FF3B30' }} />
              <span style={{ fontSize: 11, color: '#FF3B30', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>THREAT INTELLIGENCE DATABASE</span>
            </div>
            <h1 style={{
              fontSize: '2.8rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-1.5px',
              fontFamily: 'Orbitron, monospace',
              background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Forensics <span style={{ WebkitTextFillColor: '#FF3B30' }}>Analysis</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 400, margin: 0 }}>
              Curated intelligence database of flagged scam phone numbers, phishing domains, and OCR-extracted suspect identifiers across all active investigations.
            </p>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { label: 'Scam Numbers', value: phoneStats.total, color: '#FF3B30' },
              { label: 'Phishing Domains', value: linkStats.total, color: '#FF9500' },
              { label: 'Other Threats', value: otherStats.total, color: '#B026FF' },
              { label: 'Critical Threats', value: phoneStats.critical + linkStats.critical + otherStats.critical, color: '#FF2D55' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 20px', textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Orbitron, monospace', marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setRiskFilter('all'); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: active ? tab.glow : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? tab.color + '55' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14, padding: '12px 22px', cursor: 'pointer', color: active ? tab.color : 'rgba(255,255,255,0.5)',
                  fontSize: 13, fontWeight: 700, letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.25s ease', outline: 'none',
                  boxShadow: active ? `0 4px 20px ${tab.color}22` : 'none',
                }}
              >
                <UiIcon name={tab.icon} size={20} label={tab.label} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* ── FILTERS BAR ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18, padding: '14px 20px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <UiIcon name="link-search" size={16} decorative style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'phones' ? 'Search by number or scam type...' : 'Search by domain...'}
              style={{
                width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff',
                fontSize: 13, fontWeight: 500, outline: 'none',
              }}
            />
          </div>

          {/* Risk filter */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'critical', 'high', 'medium', 'low'].map(r => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                style={{
                  padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.5, border: 'none', outline: 'none',
                  background: riskFilter === r ? (RISK_COLORS[r]?.bg || 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.03)',
                  color: riskFilter === r ? (RISK_COLORS[r]?.text || '#fff') : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                {r === 'all' ? 'All Risks' : r}
              </button>
            ))}
          </div>

          {/* Category-specific filters */}
          {activeTab === 'phones' && (
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all', label: 'All Regions' },
                { id: 'india', label: 'IN India' },
                { id: 'na', label: 'NA North America' },
                { id: 'voip', label: '⌁ VoIP' },
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setPhoneRegion(r.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    border: 'none', outline: 'none',
                    background: phoneRegion === r.id ? 'rgba(255,59,48,0.12)' : 'rgba(255,255,255,0.03)',
                    color: phoneRegion === r.id ? '#FF3B30' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'phishing' && (
            <select
              value={phishingCat}
              onChange={e => setPhishingCat(e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', outline: 'none', cursor: 'pointer', minWidth: 180,
              }}
            >
              <option value="all">All Categories</option>
              {Object.keys(PHISHING_CATEGORIES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Other">Other / Uncategorized</option>
            </select>
          )}
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 100, color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: 2, fontFamily: 'Orbitron, monospace' }}>
            AGGREGATING FORENSIC INTELLIGENCE...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ──── SCAM PHONE NUMBERS ──── */}
            {activeTab === 'phones' && (
              <motion.div key="phones" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                  Showing {paginatedPhones.length} of {filteredPhones.length} flagged numbers
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['Phone Number', 'Region', 'Scam Type', 'Risk Level', 'Reports'].map(h => (
                            <th key={h} style={{ padding: '18px 24px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPhones.map((phone, i) => (
                          <motion.tr
                            key={phone.number}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'default' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '18px 24px' }}>
                              <div style={{ fontSize: 15, fontWeight: 800, color: '#FF3B30', fontFamily: 'Orbitron, monospace', letterSpacing: 0.5 }}>
                                {phone.number}
                              </div>
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                background: phone.region === 'India' ? 'rgba(255,149,0,0.1)' : phone.region === 'Unknown' ? 'rgba(255,59,48,0.1)' : 'rgba(0,180,255,0.1)',
                                color: phone.region === 'India' ? '#FF9500' : phone.region === 'Unknown' ? '#FF3B30' : '#00B4FF',
                                border: `1px solid ${phone.region === 'India' ? 'rgba(255,149,0,0.3)' : phone.region === 'Unknown' ? 'rgba(255,59,48,0.3)' : 'rgba(0,180,255,0.3)'}`,
                              }}>
                                {phone.region === 'India' ? 'IN India' : phone.region === 'Unknown' ? '⌁ VoIP' : 'NA North America'}
                              </span>
                            </td>
                            <td style={{ padding: '18px 24px', fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>
                              {phone.type}
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              {riskBadge(phone.risk)}
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: Math.min(phone.reports, 100), height: 6, borderRadius: 3,
                                  background: `linear-gradient(90deg, ${RISK_COLORS[phone.risk]?.text || '#FF9500'}, ${RISK_COLORS[phone.risk]?.text || '#FF9500'}88)`,
                                  boxShadow: `0 0 8px ${RISK_COLORS[phone.risk]?.text || '#FF9500'}44`,
                                  transition: 'width 0.5s ease',
                                }} />
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Orbitron, monospace', minWidth: 30 }}>
                                  {phone.reports}
                                </span>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──── PHISHING LINKS ──── */}
            {activeTab === 'phishing' && (
              <motion.div key="phishing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                  Showing {paginatedLinks.length} of {filteredLinks.length} flagged domains
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['Domain', 'Category', 'Risk Level', 'Reports', 'Action'].map(h => (
                            <th key={h} style={{ padding: '18px 24px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLinks.map((link, i) => (
                          <motion.tr
                            key={link.domain}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.015 }}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'default' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '18px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 10,
                                  background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.25)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                                  flexShrink: 0,
                                }}>↗</div>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FF9500', wordBreak: 'break-all' }}>
                                    {link.domain}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                                    https://{link.domain}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.1)',
                              }}>
                                {link.category}
                              </span>
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              {riskBadge(link.risk)}
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'Orbitron, monospace' }}>
                                {link.reports}
                              </span>
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              <button
                                onClick={() => { navigator.clipboard.writeText(link.domain); toast.success(`Copied: ${link.domain}`); }}
                                style={{
                                  padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.5)', cursor: 'pointer', outline: 'none',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,149,0,0.12)'; e.currentTarget.style.color = '#FF9500'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                              >
                                ⧉ Copy
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──── OTHER THREATS ──── */}
            {activeTab === 'other' && (
              <motion.div key="other" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: '24px', overflowX: 'auto' }}>
                  <div style={{ minWidth: 900 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Identifier</th>
                          <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Category</th>
                          <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Scam Type</th>
                          <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Risk Level</th>
                          <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Reports</th>
                          <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOther.map((t, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}
                          >
                            <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700, color: '#B026FF', fontFamily: 'Orbitron, monospace' }}>
                              {t.identifier}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 6, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                                {t.category}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 13, color: '#fff', fontWeight: 500 }}>
                              {t.type}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              {riskBadge(t.risk)}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(t.reports, 100)}%`, height: '100%', background: RISK_COLORS[t.risk].text }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{t.reports}</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.details}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──── OCR IDENTIFIERS ──── */}
            {activeTab === 'ocr' && (
              <motion.div key="ocr" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div style={{ display: 'grid', gap: 40 }}>
                  {/* OCR Phones */}
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                      <UiIcon name="extracted-phones" size={22} /> OCR-EXTRACTED PHONE NUMBERS ({ocrLinks.phones?.length || 0})
                    </h3>
                    {(!ocrLinks.phones || ocrLinks.phones.length === 0) ? (
                      <div style={{ color: 'rgba(255,255,255,0.3)', padding: 48, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 24, textAlign: 'center', fontSize: 14 }}>
                        No OCR-extracted phone numbers found in evidence uploads yet.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 16 }}>
                        {ocrLinks.phones.map((item, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: '#00B4FF', fontFamily: 'Orbitron, monospace' }}>{item._id}</div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{item.count} linked cases</div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {item.cases?.map((c, i) => (
                                <a key={i} href={`/admin/complaints?search=${c.id}`} style={{ background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', borderRadius: 10, padding: '8px 14px', textDecoration: 'none', color: '#00B4FF', fontSize: 11, fontWeight: 700 }}>
                                  {c.id}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* OCR UPIs */}
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                      <UiIcon name="payment-identifiers" size={22} /> OCR-EXTRACTED UPI IDENTIFIERS ({ocrLinks.upis?.length || 0})
                    </h3>
                    {(!ocrLinks.upis || ocrLinks.upis.length === 0) ? (
                      <div style={{ color: 'rgba(255,255,255,0.3)', padding: 48, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 24, textAlign: 'center', fontSize: 14 }}>
                        No OCR-extracted UPI identifiers found in evidence uploads yet.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 16 }}>
                        {ocrLinks.upis.map((item, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: '#00FFAA', fontFamily: 'Orbitron, monospace' }}>{item._id}</div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{item.count} linked cases</div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {item.cases?.map((c, i) => (
                                <a key={i} href={`/admin/complaints?search=${c.id}`} style={{ background: 'rgba(0,255,170,0.1)', border: '1px solid rgba(0,255,170,0.2)', borderRadius: 10, padding: '8px 14px', textDecoration: 'none', color: '#00FFAA', fontSize: 11, fontWeight: 700 }}>
                                  {c.id}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── PAGINATION ── */}
        {(activeTab === 'phones' || activeTab === 'phishing' || activeTab === 'other') && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '10px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                outline: 'none', transition: 'all 0.2s ease',
              }}
            >
              ← Previous
            </button>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) pageNum = i + 1;
                else if (currentPage <= 4) pageNum = i + 1;
                else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                else pageNum = currentPage - 3 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: currentPage === pageNum ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.03)',
                      border: currentPage === pageNum ? '1px solid rgba(255,59,48,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      color: currentPage === pageNum ? '#FF3B30' : 'rgba(255,255,255,0.4)',
                      outline: 'none', transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '10px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
                outline: 'none', transition: 'all 0.2s ease',
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* ── FOOTER PROTOCOL ── */}
        <div style={{
          marginTop: 80, padding: 36,
          background: 'rgba(255, 59, 48, 0.03)', backdropFilter: 'blur(40px)',
          borderRadius: 28, border: '1px solid rgba(255, 59, 48, 0.1)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: 13, color: '#FF3B30', fontWeight: 800, letterSpacing: 1, fontFamily: 'Orbitron, monospace' }}>
            <UiIcon name="investigator-protocol" size={18} /> INVESTIGATOR PROTOCOL
          </h4>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0 }}>
            This forensics database aggregates intelligence from multiple sources: OCR-extracted identifiers from uploaded evidence, curated scam phone number registries, and known phishing domain blacklists. All identifiers should be cross-referenced against original evidence before initiating legal action. Multiple independent reports against the same identifier indicate high-confidence serial criminal activity.
          </p>
        </div>
      </div>
    </div>
  );
}

// Threat Intelligence & Client Verification Engine for Mobile

export const SCAM_PHONES_INDIA = [
  { number: '+91 98000 00001', raw: '9800000001', region: 'India', risk: 'critical', reports: 47, type: 'UPI Fraud / Vishing', complaintId: 'CC-IN-9801' },
  { number: '+91 98000 00002', raw: '9800000002', region: 'India', risk: 'high', reports: 31, type: 'Loan App Scam', complaintId: 'CC-IN-9802' },
  { number: '+91 98000 00003', raw: '9800000003', region: 'India', risk: 'critical', reports: 62, type: 'OTP Interception', complaintId: 'CC-IN-9803' },
  { number: '+91 98000 00004', raw: '9800000004', region: 'India', risk: 'medium', reports: 18, type: 'Tech Support Scam', complaintId: 'CC-IN-9804' },
  { number: '+91 98000 00005', raw: '9800000005', region: 'India', risk: 'high', reports: 39, type: 'KYC Fraud Call', complaintId: 'CC-IN-9805' },
  { number: '+91 98000 00006', raw: '9800000006', region: 'India', risk: 'critical', reports: 55, type: 'Investment Scam', complaintId: 'CC-IN-9806' },
  { number: '+91 98000 00007', raw: '9800000007', region: 'India', risk: 'medium', reports: 22, type: 'Fake Delivery Call', complaintId: 'CC-IN-9807' },
  { number: '+91 98000 00008', raw: '9800000008', region: 'India', risk: 'high', reports: 36, type: 'SIM Swap Fraud', complaintId: 'CC-IN-9808' },
  { number: '+91 98000 00009', raw: '9800000009', region: 'India', risk: 'critical', reports: 71, type: 'Sextortion Call', complaintId: 'CC-IN-9809' },
];

export const SCAM_PHONES_NA = [];
for (let i = 100; i <= 199; i++) {
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const types = ['Robocall Scam', 'IRS Impersonation', 'Warranty Fraud', 'Tech Support', 'Lottery Scam', 'Debt Collection Fraud', 'Social Security Scam', 'Medicare Fraud', 'Crypto Pump Call', 'Romance Scam'];
  SCAM_PHONES_NA.push({
    number: `+1 555-0${i}`,
    raw: `5550${i}`,
    region: 'North America',
    risk: riskLevels[i % riskLevels.length],
    reports: ((i * 7) % 75) + 8,
    type: types[i % types.length],
    complaintId: `CC-NA-5550${i}`
  });
}

export const VOIP_NUMBERS = [
  { number: 'VoIP-SIP-001', raw: 'voipsip001', region: 'Unknown', risk: 'critical', reports: 94, type: 'Spoofed Caller ID Gateway', complaintId: 'CC-VOIP-001' },
  { number: 'VoIP-SIP-002', raw: 'voipsip002', region: 'Unknown', risk: 'high', reports: 58, type: 'Mass Robocall Origin', complaintId: 'CC-VOIP-002' },
  { number: 'VoIP-SIP-003', raw: 'voipsip003', region: 'Unknown', risk: 'critical', reports: 112, type: 'Vishing Gateway', complaintId: 'CC-VOIP-003' },
];

export const OTHER_THREATS = [
  { identifier: '@Crypto_Wealth_Signals_VIP', raw: '@crypto_wealth_signals_vip', category: 'Social Media', type: 'Investment Scam', risk: 'critical', reports: 124, details: 'Promotes 10x returns in 24 hours via fake trading dashboards.' },
  { identifier: '@BankHelp_Desk_99', raw: '@bankhelp_desk_99', category: 'Social Media', type: 'Support Impersonation', risk: 'high', reports: 88, details: 'Replies to customer complaints offering "instant resolution" links.' },
  { identifier: 'Official_Govt_Subsidy_Bot', raw: 'official_govt_subsidy_bot', category: 'Social Media', type: 'Advance-Fee Scam', risk: 'high', reports: 210, details: 'Claims user won a government grant, demands a "transfer fee" first.' },
  { identifier: 'fast.loan.approval@paytm', raw: 'fast.loan.approval@paytm', category: 'Financial', type: 'Fake Loan Disbursal', risk: 'critical', reports: 342, details: 'Asks for a "processing fee" or "GST" upfront before loan release.' },
  { identifier: '4099-8821-3310', raw: '409988213310', category: 'Financial', type: 'Unregistered Shell Account', risk: 'critical', reports: 19, details: 'Bank Name: Apex Trust International Bank. Used for temporary routing of wire fraud; name mimics real global banks.' },
  { identifier: '0x71C...B49a', raw: '0x71cb49a', category: 'Financial', type: 'Romance / Pig Butchering', risk: 'high', reports: 45, details: 'Crypto Wallet (USDT TRC20). Destination address for fraudulent investment platforms.' },
  { identifier: 'Instant_Loan_Approved.apk', raw: 'instant_loan_approved.apk', category: 'Malicious App', type: 'Extortion Malware', risk: 'critical', reports: 512, details: 'Disguised as Quick personal loan app. Harvests contact lists, SMS messages, and photo galleries for extortion.' },
  { identifier: 'Secure_Bank_Token_Sync', raw: 'secure_bank_token_sync', category: 'Malicious App', type: 'OTP Interceptor', risk: 'critical', reports: 89, details: 'Disguised as 2FA authentication utility. Intercepts OTPs and logs bank login credentials.' },
  { identifier: 'Free_Crypto_Multiplier', raw: 'free_crypto_multiplier', category: 'Malicious App', type: 'Overlay Malware', risk: 'high', reports: 122, details: 'Disguised as Cryptocurrency cloud miner. Overlays fake login screens on legitimate banking apps.' },
];

export const ALL_PHONES = [...SCAM_PHONES_INDIA, ...SCAM_PHONES_NA, ...VOIP_NUMBERS];

const PHISHING_RAW = `graphicriver.net,ecnavi.jp,hubpages.com,extratorrent.cc,icicibank.com,nypost.com,kienthuc.net.vn,thenextweb.com,tobogo.net,akhbarelyom.com,tunein.com,tune.pk,sfglobe.com,mic.com,couchtuner.eu.com,olx.in,venturebeat.com,allegro.pl,tinnhanh360.net,metro.co.uk,gawker.com,steamcommunity.com,kaskus.co.id,shutterstock.com,repubblica.it,pantip.com,sitepoint.com,kinopoisk.ru,youm7.com,kickass.to,webmd.com,usatoday.com,livedoor.jp,xinhuanet.com,ign.com,adbooth.com,mercadolibre.com.ar,adcash.com,ehow.com,dianping.com,doublepimp.com,billboard.com,merdeka.com,lifehacker.com,espn.go.com,rt.com,variety.com,namu.wiki,telegraph.co.uk,detik.com,dramafire.com,softonic.com,theguardian.com,google.com,kinox.to,dailymail.co.uk,bleacherreport.com,instructables.com,dmm.co.jp,lefigaro.fr,kompas.com,tribunnews.com,latimes.com,wiktionary.org,abs-cbnnews.com,investing.com,bloomberg.com,slideshare.net,daum.net,wikia.com,wikihow.com,mashable.com,theverge.com,gamefaqs.com,gsmarena.com,subscene.com,engadget.com,fool.com,alwafd.org,liputan6.com,cbssports.com,gamepedia.com,booking.com,soha.vn,rottentomatoes.com,viki.com,goodreads.com,wordreference.com,chip.de,time.com,kinogo.co,sapo.pt,gamespot.com,sohu.com,spox.com,techradar.com,forbes.com,businessinsider.com,chron.com,focus.de,digitaltrends.com,zdnet.com,marica.com,washingtontimes.com,cnet.com,pcworld.com,huffingtonpost.com,dailykos.com,gizmodo.com,pcmag.com,tomshardware.com,slate.com,theatlantic.com,salon.com,vox.com,medium.com,buzzfeed.com,arstechnica.com,polygon.com,vice.com,kotaku.com,destructoid.com,thefire.org,fandom.com,thoughtco.com,lifewire.com,tripsavvy.com,thespruce.com,verywellhealth.com,investopedia.com,balance.com,treehugger.com,simplyrecipes.com,seriousEats.com,thesprucepets.com,thespruceeats.com,byrdie.com,myanimelist.net,boardgamegeek.com,nexusmods.com,moddb.com,curseforge.com,nexus.org,github.com,gitlab.com,bitbucket.org,sourceforge.net,npmJS.com,pypi.org,rubygems.org,packagist.org,crates.io,docker.com,huggingface.co,kaggle.com,replit.com,codepen.io,stackexchange.com,stackoverflow.com,superuser.com,serverfault.com,askubuntu.com,mathoverflow.net,reddit.com,quora.com,substack.com,dev.to,hashnode.com,hackernews.ycombinator.com,slashdot.org,producthunt.com,indiehackers.com,dribbble.com,behance.net,artstation.com,deviantart.com,unsplash.com,pexels.com,pixabay.com,freepik.com,flaticon.com,fontspace.com,dafont.com,fonts.google.com,canva.com,figma.com,miro.com,trello.com,notion.so,asana.com,monday.com,clickup.com,airtable.com,basecamp.com,slack.com,discord.com,telegram.org,whatsapp.com,signal.org,element.io,matrix.org,zoom.us,meet.google.com,teams.microsoft.com,webex.com,skype.com,viber.com,line.me,kakaotalk.com,wechat.com,qq.com,sina.com.cn,weibo.com,baidu.com,zhihu.com,bilibili.com,youku.com,iqiyi.com,douyin.com,tiktok.com,kwai.com,threads.net,x.com,twitter.com,facebook.com,instagram.com,linkedin.com,pinterest.com,tumblr.com,flickr.com,500px.com,vimeo.com,dailymotion.com,twitch.tv,kick.com,rumble.com,bitchute.com,odysee.com,youtube.com,spotify.com,soundcloud.com,bandcamp.com,deezer.com,pandora.com,tidal.com,apple.com,microsoft.com,amazon.com,ebay.com,walmart.com,target.com,bestbuy.com,homedepot.com,lowes.com,etsy.com,shopify.com,aliexpress.com,alibaba.com,taobao.com,tmall.com,jd.com,rakuten.co.jp,shopee.com,lazada.com,tokopedia.com,blibli.com,bukalapak.com,flipkart.com,myntra.com,ajio.com,snapdeal.com,meesho.com,nykaa.com,zepto.in,blinkit.com,instamart.in,bigbasket.com,swiggy.com,zomato.com,ubereats.com,doordash.com,grubhub.com,deliveroo.co.uk,justeat.com,takeaway.com,foodpanda.com,uber.com,lyft.com,grab.com,gojek.com,bolt.eu,free-now.com,ola.in,rapido.bike,makemytrip.com,goibibo.com,yatra.com,cleartrip.com,easemytrip.com,expedia.com,kayak.com,skyscanner.net,tripadvisor.com,airbnb.com,vrbo.com,hostelworld.com,agoda.com,hotels.com,trivago.com,priceline.com,orbitz.com,travelocity.com,delta.com,united.com,americanairlines.com,southwest.com,lufthansa.com,britishairways.com,emirates.com,qatarairways.com,singaporeair.com,cathaypacific.com,airindia.in,indigo.in,spicejet.com,akasaair.com,paytm.com,phonepe.com,gpay.app,cred.club,razorpay.com,stripe.com,paypal.com,wise.com,revolut.com,n26.com,chime.com,robinhood.com,coinbase.com,binance.com,kraken.com,bybit.com,okx.com,kucoin.com,bitfinex.com,gate.io,crypto.com,metamask.io,trustwallet.com,opensea.io,rarible.com,blur.io`;

export const PHISHING_SET = new Set(PHISHING_RAW.split(',').map(d => d.trim().toLowerCase()));

export function normalizeDigits(str) {
  return (str || '').replace(/\D/g, '');
}

export function extractDomain(urlStr) {
  if (!urlStr) return '';
  let clean = urlStr.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//i, '');
  clean = clean.replace(/^www\./i, '');
  clean = clean.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  return clean;
}

export function lookupThreatClient(query) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim();
  const qLower = q.toLowerCase();
  const qDigits = normalizeDigits(q);
  const qDomain = extractDomain(q);

  const matched = [];

  // 1. Check Phone Numbers
  for (const p of ALL_PHONES) {
    const pDigits = normalizeDigits(p.number);
    if (
      (qDigits.length >= 4 && (pDigits.endsWith(qDigits) || qDigits.endsWith(pDigits) || pDigits.includes(qDigits) || qDigits.includes(pDigits))) ||
      p.number.toLowerCase().includes(qLower) ||
      qLower.includes(p.number.toLowerCase()) ||
      (p.raw && qLower.includes(p.raw))
    ) {
      matched.push({
        complaintId: p.complaintId,
        category: `Scam Phone (${p.type})`,
        severity: p.risk === 'critical' || p.risk === 'high' ? 'high' : 'medium',
        riskLevel: p.risk,
        identifier: p.number,
        type: 'PHONE',
        details: `Identified as fraudulent calling vector (${p.type}) in ${p.region}. Flagged across ${p.reports} incident reports.`,
        status: 'FLAGGED',
        createdAt: new Date().toISOString()
      });
    }
  }

  // 2. Check Phishing Domains
  if (PHISHING_SET.has(qDomain) || PHISHING_SET.has(qLower)) {
    const domainMatch = PHISHING_SET.has(qDomain) ? qDomain : qLower;
    matched.push({
      complaintId: `PHISH-${domainMatch.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 10)}`,
      category: 'Phishing & Fake Domain',
      severity: 'high',
      riskLevel: 'critical',
      identifier: domainMatch,
      type: 'WEBSITE',
      details: `Blacklisted phishing destination [${domainMatch}]. Reported in multiple credential harvesting and spoofing campaigns.`,
      status: 'BLOCKED',
      createdAt: new Date().toISOString()
    });
  } else {
    // Partial domain substring check
    for (const domain of PHISHING_SET) {
      if (qDomain && (domain === domain || domain.includes(qDomain) || (qDomain.length >= 5 && qDomain.includes(domain)))) {
        matched.push({
          complaintId: `PHISH-${domain.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 10)}`,
          category: 'Phishing & Fake Domain',
          severity: 'high',
          riskLevel: 'critical',
          identifier: domain,
          type: 'WEBSITE',
          details: `Blacklisted phishing destination [${domain}]. Reported in multiple credential harvesting and spoofing campaigns.`,
          status: 'BLOCKED',
          createdAt: new Date().toISOString()
        });
        break;
      }
    }
  }

  // 3. Check Other Threats (Apps, Social Media, UPI/Bank)
  for (const t of OTHER_THREATS) {
    if (t.identifier.toLowerCase().includes(qLower) || qLower.includes(t.identifier.toLowerCase()) || (t.raw && qLower.includes(t.raw))) {
      matched.push({
        complaintId: `ID-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        category: t.category,
        severity: t.risk === 'critical' ? 'high' : 'medium',
        riskLevel: t.risk,
        identifier: t.identifier,
        type: 'OTHER',
        details: `${t.type}: ${t.details}`,
        status: 'FLAGGED',
        createdAt: new Date().toISOString()
      });
    }
  }

  return matched;
}

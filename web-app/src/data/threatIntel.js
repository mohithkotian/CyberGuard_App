// Client-Side Threat Intelligence & Verification Engine

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

/* ───────── VERIFIED AUTHORITY & ALLOWED DOMAINS ───────── */
export const AUTHORITY_DOMAINS_RAW = `
google.com,apple.com,microsoft.com,amazon.com,amazon.in,reddit.com,github.com,gitlab.com,
bitbucket.org,sourceforge.net,npmjs.com,pypi.org,rubygems.org,packagist.org,crates.io,
docker.com,huggingface.co,kaggle.com,replit.com,codepen.io,stackexchange.com,stackoverflow.com,
superuser.com,serverfault.com,askubuntu.com,mathoverflow.net,quora.com,substack.com,dev.to,
hashnode.com,ycombinator.com,slashdot.org,producthunt.com,indiehackers.com,dribbble.com,
behance.net,artstation.com,deviantart.com,unsplash.com,pexels.com,pixabay.com,freepik.com,
flaticon.com,fontspace.com,dafont.com,canva.com,figma.com,miro.com,trello.com,notion.so,
asana.com,monday.com,clickup.com,airtable.com,basecamp.com,slack.com,discord.com,telegram.org,
whatsapp.com,signal.org,element.io,matrix.org,zoom.us,webex.com,skype.com,viber.com,line.me,
kakaotalk.com,wechat.com,qq.com,sina.com.cn,weibo.com,baidu.com,zhihu.com,bilibili.com,
youku.com,iqiyi.com,douyin.com,tiktok.com,kwai.com,threads.net,x.com,twitter.com,facebook.com,
instagram.com,linkedin.com,pinterest.com,tumblr.com,flickr.com,500px.com,vimeo.com,
dailymotion.com,twitch.tv,kick.com,rumble.com,bitchute.com,odysee.com,youtube.com,spotify.com,
soundcloud.com,bandcamp.com,deezer.com,pandora.com,tidal.com,ebay.com,walmart.com,target.com,
bestbuy.com,homedepot.com,lowes.com,etsy.com,shopify.com,aliexpress.com,alibaba.com,taobao.com,
tmall.com,jd.com,rakuten.co.jp,shopee.com,lazada.com,tokopedia.com,blibli.com,bukalapak.com,
flipkart.com,myntra.com,ajio.com,snapdeal.com,meesho.com,nykaa.com,zepto.in,blinkit.com,
instamart.in,bigbasket.com,swiggy.com,zomato.com,ubereats.com,doordash.com,grubhub.com,
deliveroo.co.uk,justeat.com,takeaway.com,foodpanda.com,uber.com,lyft.com,grab.com,gojek.com,
bolt.eu,free-now.com,ola.in,rapido.bike,makemytrip.com,goibibo.com,yatra.com,cleartrip.com,
easemytrip.com,expedia.com,kayak.com,skyscanner.net,tripadvisor.com,airbnb.com,vrbo.com,
hostelworld.com,agoda.com,hotels.com,trivago.com,priceline.com,orbitz.com,travelocity.com,
delta.com,united.com,americanairlines.com,southwest.com,lufthansa.com,britishairways.com,
emirates.com,qatarairways.com,singaporeair.com,cathaypacific.com,airindia.in,indigo.in,
spicejet.com,akasaair.com,irctc.co.in,
icicibank.com,hdfcbank.com,sbi.co.in,axisbank.com,kotak.com,pnbindia.in,bankofbaroda.in,
canarabank.com,unionbankofindia.co.in,idbibank.in,indusind.com,yesbank.in,rbi.org.in,
npci.org.in,bhimupi.org.in,cybercrime.gov.in,mha.gov.in,uidai.gov.in,incometax.gov.in,
paytm.com,phonepe.com,gpay.app,cred.club,razorpay.com,stripe.com,paypal.com,wise.com,
revolut.com,n26.com,chime.com,robinhood.com,coinbase.com,binance.com,kraken.com,bybit.com,
okx.com,kucoin.com,bitfinex.com,gate.io,crypto.com,metamask.io,trustwallet.com,opensea.io,
rarible.com,blur.io,theguardian.com,bbc.com,nytimes.com,washingtonpost.com,forbes.com,
bloomberg.com,reuters.com,cnet.com,theverge.com,techradar.com,wired.com,arstechnica.com
`;

export const AUTHORITY_DOMAINS = new Set(
  AUTHORITY_DOMAINS_RAW
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(Boolean)
);

/* ───────── CURATED MALICIOUS & PHISHING INDICATORS ───────── */
const PHISHING_RAW = `
fake-google-login.example,evilgoogle.com,google.com.evil.example,
icici-kyc-verification.net,icicibank-security-update.com,secure-icici-login.xyz,
paytm-kyc-update.com,paytm-cashback-claim.xyz,paytm-refund-portal.net,
sbi-reward-points.info,sbi-yono-kyc-update.com,hdfc-netbanking-alert.com,
support-apple-id-verify.com,apple-id-locked-resolve.net,icloud-security-check.xyz,
update-microsoft-auth.com,microsoft-security-alert.top,office365-verify-portal.com,
amazon-prime-security.shop,amazon-giftcard-claim.xyz,amazon-order-refund.top,
paypal-security-alert.top,paypal-dispute-resolve.com,paypal-account-verify.online,
netflix-billing-update.xyz,netflix-suspended-account.com,
metamask-restore-wallet.cc,wallet-validation-portal.io,crypto-airdrop-claim.live,
binance-verification-support.net,secure-web3-connect.io,trustwallet-seed-verify.com,
telegram-free-premium.xyz,whatsapp-support-verification.com,
extratorrent.cc,kickass.to,kinox.to,kinogo.co,couchtuner.eu.com,tinnhanh360.net,
adbooth.com,doublepimp.com,tobogo.net,adcash.com
`;

export const PHISHING_SET = new Set(
  PHISHING_RAW
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(Boolean)
);

export function normalizeDigits(str) {
  return (str || '').replace(/\D/g, '');
}

export function extractDomain(urlStr) {
  if (!urlStr) return '';
  let clean = urlStr.trim().toLowerCase();
  clean = clean.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  clean = clean.replace(/^www\./i, '');
  clean = clean.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  return clean;
}

export function isAuthorityDomain(domain) {
  if (!domain) return false;
  const d = domain.toLowerCase();
  if (AUTHORITY_DOMAINS.has(d)) return true;
  for (const auth of AUTHORITY_DOMAINS) {
    if (d.endsWith('.' + auth)) return true;
  }
  return false;
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

  // 2. Check Phishing Domains (Skipping legitimate authority domains)
  if (qDomain && !isAuthorityDomain(qDomain)) {
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
      // Partial domain substring check against curated phishing list
      for (const domain of PHISHING_SET) {
        if (domain === qDomain || domain.includes(qDomain) || (qDomain.length >= 5 && qDomain.includes(domain))) {
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
  }

  // 3. Check Other Threats (Social, Crypto, Malicious Apps)
  for (const item of OTHER_THREATS) {
    if (
      item.identifier.toLowerCase().includes(qLower) ||
      qLower.includes(item.identifier.toLowerCase()) ||
      (item.raw && qLower.includes(item.raw))
    ) {
      matched.push({
        complaintId: `THREAT-${item.identifier.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8)}`,
        category: item.category,
        severity: item.risk === 'critical' ? 'high' : 'medium',
        riskLevel: item.risk,
        identifier: item.identifier,
        type: item.type,
        details: item.details,
        status: 'FLAGGED',
        createdAt: new Date().toISOString()
      });
    }
  }

  return matched;
}

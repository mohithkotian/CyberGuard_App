"""
phishing.py — CyberGuard ML v3 Phishing Generator
10 distinct scenario families:
0: bank_kyc_suspension
1: utility_electricity_cutoff
2: tax_refund_notice
3: corporate_m365_sso
4: courier_customs_delivery
5: telecom_esim_sim_swap
6: lottery_reward_points
7: cloud_drive_sharing
8: social_media_account_warning
9: job_recruitment_portal
12 detailed narratives (40-120 words) + 3 concise inputs (10-25 words) per family = 150 samples.
"""

FAMILIES = [
    {
        'id': 'phishing_fam_00',
        'name': 'bank_kyc_suspension',
        'style': 'first_person_complaint',
        'narratives': [
            "Yesterday afternoon I received an urgent text from sender VK-SBINB claiming my savings account was blocked due to an unlinked PAN document. The message included a link to sbi-kyc-desk.online and warned of permanent deactivation. Believing it was official, I opened the page and submitted my netbanking user ID and profile password. Within four minutes, my phone registered two unauthorized debit alerts totaling 48,000 rupees transferred via IMPS.",
            "An unauthorized withdrawal of 37,500 rupees was drained from my HDFC bank account after I responded to an SMS from VM-HDFCBK. The text instructed me to update mandatory KYC details at hdfc-netbanking-portal.in to prevent card suspension. The fraudulent website prompted for my customer ID, password, and transaction OTP. Once submitted, the screen threw an error code while the funds were immediately transferred to an unknown beneficiary.",
            "Filing a cyber grievance regarding credential theft and account compromise. A fraudulent SMS from AD-ICICIB warned that my mobile banking would be suspended within 24 hours unless verified at icici-security-verify.info. I accessed the link and provided my netbanking credentials along with my debit card PIN. Fraudsters used the data to execute an unauthorized transfer of 65,000 rupees to an account in another state.",
            "I am lodging a complaint against a fraudulent SMS from sender BZ-AXISBK claiming my credit card had been temporarily blocked. The SMS asked me to re-validate my credentials at axis-pan-link.org. The portal mirrored the legitimate bank website, prompting for my card number, CVV, and login password. Immediately after clicking submit, three unauthorized point-of-sale debits totaling 52,000 rupees occurred.",
            "At around 11:15 AM, my mobile phone alerted me to a message from MD-PNBBNK stating that my Punjab National Bank account was suspended. The notification urged me to resolve the issue at pnb-online-update.net. After entering my netbanking credentials, I received an OTP which I typed on the site, resulting in 29,000 rupees debited from my savings.",
            "A deceptive message sent from BO-BOBBNK claimed that my Bank of Baroda account required immediate KYC verification to avoid account freeze. I clicked the embedded link bob-verification.co.in and filled out my confidential internet banking login credentials. Attackers utilized these credentials to initiate an illegal RTGS transaction of 84,000 rupees to an external wallet.",
            "My Kotak Mahindra account was compromised following an SMS alert from JK-KOTAK warning of an expired security certificate. The link redirected to kotak-netbanking-desk.com where I entered my CRN and password. Minutes later, unauthorized fund transfers debited 43,000 rupees without my consent, leaving my monthly account balance completely empty.",
            "I received an alarming text from CP-CANBNK alleging that my Canara Bank debit card was deactivated due to missing Aadhaar linkage. I followed the URL canara-aadhaar-link.net and entered my card details and ATM PIN. Shortly afterward, multiple unauthorized ATM cash withdrawals totaling 40,000 rupees took place in another city.",
            "A text message from UB-UNION warned that my Union Bank netbanking access was restricted due to pending KYC renewal. Following the link unionbank-kyc-update.org, I submitted my account number, username, and login password. The attackers immediately initiated an unauthorized IMPS transfer of 31,000 rupees to a third-party mule account.",
            "An urgent SMS from ID-INDUS claimed my IndusInd Bank profile password had expired and provided indusind-password-reset.info to change it. I entered my existing netbanking credentials and OTP on the site. Within ten minutes, two unauthorized debits amounting to 58,000 rupees emptied my savings account.",
            "Fraudulent communication received under header VK-SBINB directed me to verify my banking credentials via sbi-customer-support.online to avoid an administrative penalty. I input my netbanking username and transaction password. The fraudsters immediately accessed my account and siphoned off 72,000 rupees to an unknown digital account.",
            "A notification from VM-HDFCBK warned that my debit card international limit was modified and directed me to hdfc-card-verify.net to cancel the request. I provided my card number and CVV on the spoofed form. Attackers instantly executed an unauthorized foreign currency transaction worth 46,000 rupees."
        ],
        'concise': [
            "Fake bank KYC message provided a link that stole my netbanking password and debited 45000 rupees.",
            "Clicked SMS link claiming account freeze, entered banking credentials, and lost my monthly salary.",
            "Received fraudulent bank text with verification link which stole my debit card PIN and drained funds."
        ]
    },
    {
        'id': 'phishing_fam_01',
        'name': 'utility_electricity_cutoff',
        'style': 'first_person_complaint',
        'narratives': [
            "An alarming message arrived on my phone claiming that electricity supply from BESCOM would be disconnected tonight at 9:30 PM due to an unpaid bill. The text directed me to call an officer number and click bijli-seva-desk.com to pay a 15-rupee penalty. Upon submitting my debit card details and OTP on the portal, an unauthorized sum of 38,000 rupees was debited from my account.",
            "I received an urgent SMS warning that power from MSEDCL would be terminated within two hours. The message contained a link to download an application called Electricity_Update.apk to settle the balance. After installing the application, my phone froze and malware forwarded incoming banking OTPs, allowing criminals to drain 54,000 rupees from my bank account.",
            "Reporting a utility disconnection scam originating from an SMS claiming to represent UPPCL. The sender stated that yesterday's electricity payment was not updated in the government billing software. I followed the link uppcl-bill-clear.org and entered my netbanking user ID and password. Attackers immediately initiated an unauthorized IMPS transfer of 42,000 rupees.",
            "A text message warning of power cut from WBSEDCL instructed me to contact a bill verification desk at 9831098212 and visit wbsedcl-payment-portal.info. I entered my credit card credentials to pay a nominal 10-rupee reconnection fee. Instead of 10 rupees, my card was charged 67,000 rupees across multiple unauthorized transactions.",
            "A notification claiming to be from TANGEDCO warned that my electricity connection would be disconnected by midnight for non-payment. The message directed me to tangedco-online-pay.in to verify billing details. I input my banking card number and CVV, resulting in an unauthorized international charge of 49,000 rupees.",
            "I received an SMS regarding pending electricity charges from DHBVN threatening instant disconnection. The text directed me to an online portal dhbvn-quickbill.net where I entered my debit card credentials. Minutes later, an unauthorized transfer of 33,000 rupees was processed from my savings account.",
            "A threatening SMS stated that power supply from Tata Power would be cut off immediately due to an unpaid previous month invoice. I followed the link tatapower-billpay.co.in and submitted my netbanking login credentials. Fraudsters subsequently accessed my bank portal and debited 61,000 rupees.",
            "An SMS sent under the guise of Adani Electricity claimed my meter reading was flagged for non-payment. The message asked me to install an APK file from a cloud storage link. The malicious app intercepted my banking messages and enabled unauthorized withdrawals totaling 45,000 rupees.",
            "I am filing a complaint regarding a fraudulent power disconnection alert from BSES Rajdhani. The message instructed me to access bses-billdesk.org and submit banking details. After entering my netbanking credentials, my savings account was debited for 28,000 rupees without authorization.",
            "A text message warned that PSPCL power supply would be disconnected due to a failed meter recharge. I followed the payment link pspcl-recharge.online and provided my debit card number and ATM PIN. Criminals used the information to withdraw 39,000 rupees from an automated teller machine.",
            "Received an urgent SMS claiming my state electricity board bill was overdue and service would terminate within thirty minutes. I clicked the embedded link and authorized what appeared to be a 20-rupee verification payment, but 47,000 rupees was debited from my account.",
            "An electricity bill fraud notification claimed that our residential power line was scheduled for immediate disconnection. I entered my internet banking password on the linked site bijli-bill-desk.com, leading to an unauthorized wire transfer of 50,000 rupees."
        ],
        'concise': [
            "Fake electricity bill disconnection alert led to a spoofed payment site that stole 42000 rupees.",
            "Clicked link in power cut threat message and entered card credentials resulting in unauthorized withdrawal.",
            "SMS warned of electricity termination, directed to malicious portal that captured netbanking login details."
        ]
    },
    {
        'id': 'phishing_fam_02',
        'name': 'tax_refund_notice',
        'style': 'first_person_complaint',
        'narratives': [
            "I received an official-looking email with the subject Notice of Income Tax Refund Approval claiming an approved refund of 48,500 rupees. The email instructed me to verify my banking details at incometax-refund-portal.in to release the funds. I entered my PAN, bank account number, and internet banking password. Shortly afterward, 62,000 rupees was debited from my account rather than credited.",
            "A fraudulent communication claiming to represent the Income Tax Department stated that my annual tax assessment required urgent verification. The message contained a shortened link leading to efiling-incometax-verify.online. I entered my netbanking user ID and transaction password on the portal, resulting in an unauthorized transfer of 55,000 rupees.",
            "An SMS alert notified me that an income tax refund of 32,400 rupees was held up due to invalid bank details. I accessed the link incometax-pan-refund.net and filled in my debit card credentials, CVV, and ATM PIN. Within minutes, multiple unauthorized transactions totaling 40,000 rupees debited my account.",
            "I received an email purporting to be from the Central Board of Direct Taxes regarding an outstanding tax credit of 51,000 rupees. The link led to a counterfeit government page that prompted for my mobile banking MPIN and customer ID. Attackers used this information to execute unauthorized debits totaling 70,000 rupees.",
            "A deceptive text message claimed my PAN card would be cancelled by the tax authorities unless validated through incometax-efiling-desk.org. I followed the instructions and submitted my netbanking login details. Fraudsters immediately accessed my account and transferred 36,000 rupees to an unknown beneficiary.",
            "An email regarding an unexpected tax rebate instructed me to click incometax-refund-approval.co.in to choose my preferred deposit account. I entered my banking login credentials and OTP. Moments later, 44,000 rupees was withdrawn from my account without my authorization.",
            "I am filing a complaint regarding a fake income tax notification claiming an overpayment of 27,800 rupees. The attached link directed me to a spoofed government site where I provided my debit card number and PIN. Criminals subsequently emptied 35,000 rupees from my account.",
            "Received an SMS stating that my income tax return assessment showed an adjustment refund of 43,200 rupees. I visited the specified link and input my bank account login credentials. Unauthorized IMPS transfers followed immediately, removing 58,000 rupees from my balance.",
            "A notification claiming to be from the Income Tax department warned of an impending audit fine unless verified at tax-assessment-online.net. After entering my banking credentials on the form, an unauthorized debit of 30,000 rupees was executed from my savings account.",
            "An official-styled email claimed that my tax deduction certificate contained discrepancies and directed me to a verification portal. I submitted my netbanking username and profile password, leading to an immediate fraudulent withdrawal of 68,000 rupees.",
            "I received a message claiming an income tax refund voucher had been issued in my name. The link directed to a fake portal requesting debit card details and OTP, resulting in an unauthorized deduction of 25,000 rupees.",
            "A text message claimed my tax refund was approved but required identity confirmation at incometax-claim.org. I entered my internet banking credentials, and within minutes, 50,000 rupees was stolen via unauthorized wire transfer."
        ],
        'concise': [
            "Counterfeit income tax refund email directed me to a fake portal that captured my netbanking password.",
            "Fake tax assessment link prompted for debit card credentials and drained 40000 rupees from my account.",
            "Received spoofed message about income tax refund, entered login credentials on fraudulent portal and lost funds."
        ]
    },
    {
        'id': 'phishing_fam_03',
        'name': 'corporate_m365_sso',
        'style': 'organizational_incident_report',
        'narratives': [
            "Our corporate IT security desk is reporting a targeted credential harvesting incident. Several employees received an email purportedly from the internal HR department regarding updated leave policy documents. The link led to a spoofed Microsoft 365 single sign-on portal at login-microsoft-corp.online. Three employees submitted their corporate credentials, which attackers used to access internal email correspondence and exfiltrate proprietary attachments.",
            "An enterprise phishing incident occurred when our staff received an email warning that their Microsoft 365 password was expiring in 24 hours. The embedded URL directed employees to a fake corporate authentication page at office365-password-portal.com. One system administrator submitted their credentials, allowing attackers to access our internal cloud tenant and modify mailbox forwarding rules.",
            "Reporting an unauthorized access incident resulting from a spoofed IT service desk notification. The email instructed personnel to confirm multi-factor authentication settings on corporate-sso-verify.net. Two engineers submitted their corporate login passwords and session codes, granting an external threat actor unauthorized access to our internal project documentation repositories.",
            "A spear-phishing attack targeted our finance department via an email claiming to contain an overdue invoice in a shared SharePoint document. Clicking the link led to a replica of our company single sign-on screen hosted on external infrastructure. The finance manager input login credentials, which attackers immediately used to send fraudulent wire transfer instructions.",
            "Our company security operations center detected an email campaign mimicking our corporate VPN portal. The email urged staff to update remote work access credentials at vpn-access-corporate.org. Five remote workers submitted their enterprise usernames and passwords before security teams blocked the malicious domain at the edge firewall.",
            "An employee received an email appearing to come from the Chief Executive Officer requesting urgent review of an executive compensation memorandum. The link directed the user to a fake Google Workspace login portal at accounts-google-workspace.co. An employee provided corporate credentials, enabling unauthorized mailbox access by external actors.",
            "A deceptive communication disguised as an internal IT survey requested staff to authenticate using their enterprise credentials at company-survey-portal.net. Two users complied, allowing external adversaries to compromise corporate mailboxes and send secondary phishing emails across our supplier network.",
            "Our incident response team detected multiple outbound connections to an external credential harvesting site office-portal-verify.info after employees received a message about an unread voicemail notification. The landing page captured corporate usernames and passwords of three personnel.",
            "An employee fell victim to an email claiming their cloud email storage was 98 percent full and directed them to upgrade-quota-portal.com. The employee input their corporate domain credentials, which compromised their email account and allowed threat actors to monitor internal financial communications.",
            "We are reporting an incident where employees received an invitation to a fake mandatory compliance training webinar. The link led to a cloned corporate login screen that recorded user credentials, resulting in unauthorized access to our corporate document management system.",
            "A credential harvesting campaign targeted our legal team using an email claiming to share court filings via OneDrive. The spoofed authentication page harvested corporate login details, leading to unauthorized access to confidential client communications.",
            "Corporate IT identified a phishing email impersonating our payroll software vendor. Employees who clicked the link entered their enterprise login credentials on a fraudulent domain, compromising internal employee records and salary information."
        ],
        'concise': [
            "Targeted employee email led to fake Microsoft 365 portal that harvested corporate credentials.",
            "Staff entered corporate login passwords on spoofed single sign-on page resulting in unauthorized mailbox access.",
            "Fraudulent internal IT notification directed employees to a credential theft portal compromising enterprise accounts."
        ]
    },
    {
        'id': 'phishing_fam_04',
        'name': 'courier_customs_delivery',
        'style': 'first_person_complaint',
        'narratives': [
            "I received an SMS alert purporting to be from India Post stating that my package could not be delivered due to an incomplete street address. The notification instructed me to update my shipping details at indiapost-address-update.online and pay a 25-rupee redelivery fee. Upon entering my credit card details and OTP on the payment gateway, my card was charged 48,000 rupees across two unauthorized debits.",
            "An urgent text message claiming to represent DHL Express informed me that an international parcel was detained by customs authorities. The message directed me to dhl-customs-clearance.net to settle a 50-rupee processing surcharge. I entered my debit card credentials and ATM PIN on the form, resulting in an unauthorized withdrawal of 60,000 rupees within minutes.",
            "Filing a cyber complaint regarding a parcel delivery scam. I received a message from sender header BZ-FEDEX stating that my courier shipment was on hold. I clicked fedex-tracking-portal.info and submitted my netbanking credentials to pay a nominal re-routing fee. Attackers immediately initiated an unauthorized IMPS transfer of 35,000 rupees from my account.",
            "A notification appearing to originate from Blue Dart courier warned that my consignment would be returned to the sender unless delivery fees were confirmed within 12 hours. I followed the link bluedart-courier-update.com and entered my card credentials. The portal captured my CVV and OTP, resulting in an illegal debit of 42,000 rupees.",
            "I was expecting a courier and received a text stating that my package delivery was pending due to an incorrect postal code. The message directed me to courier-package-desk.net to verify my address and pay 18 rupees. After submitting my debit card information, my bank sent an alert indicating a deduction of 55,000 rupees.",
            "A message sent under the name of DTDC courier claimed my delivery attempt had failed and provided dtdc-consignment-verify.org to reschedule. I entered my banking card number and mobile OTP. Fraudsters utilized the data to make an unauthorized payment of 39,000 rupees to an online merchant.",
            "I received an SMS regarding a postal parcel requiring customs documentation fee payment at postal-delivery-fees.online. Believing it was genuine, I entered my netbanking user ID and transaction password. Minutes later, an unauthorized wire transfer of 65,000 rupees was completed from my account.",
            "A text message claiming that a package from Delhivery was held at the local hub directed me to delhivery-tracking-support.net. I input my debit card details to pay a 12-rupee re-attempt fee, but 47,000 rupees was debited from my savings balance instead.",
            "An alert from an unknown sender header claimed that an urgent medical shipment was awaiting delivery clearance. The message directed me to an address update site where I submitted my banking credentials, resulting in unauthorized debits totaling 31,000 rupees.",
            "I received an SMS claiming to be from express cargo logistics requiring an online fee payment to avoid package abandonment. The link directed to a spoofed payment form that captured my debit card PIN and drained 38,000 rupees from my bank account.",
            "A courier delivery message instructed me to click a link to update my apartment number for parcel delivery. I entered my credit card credentials to pay a small fee, resulting in an unauthorized transaction of 52,000 rupees.",
            "Fraudulent postal service notification stated my parcel was held in customs. I provided netbanking login credentials on the linked portal, leading to an immediate unauthorized transfer of 40,000 rupees."
        ],
        'concise': [
            "Fake courier delivery message asked for 25 rupees redelivery fee and stole 48000 rupees via card fraud.",
            "Clicked link in parcel address update SMS, entered debit card credentials, and lost my account balance.",
            "Fraudulent postal tracking notification directed to spoofed payment page that captured banking credentials."
        ]
    },
    {
        'id': 'phishing_fam_05',
        'name': 'telecom_esim_sim_swap',
        'style': 'first_person_complaint',
        'narratives': [
            "I received a text message purporting to be from Jio customer care warning that my physical SIM card was scheduled for deactivation unless upgraded to 5G via jio-5g-upgrade.online. The webpage prompted me to enter my mobile number, Aadhaar number, and credit card details to confirm ownership. Within thirty minutes of submission, my mobile network vanished, and fraudsters executed unauthorized bank transfers totaling 85,000 rupees.",
            "An SMS alert from sender VM-AIRTEL warned that my telecom KYC had expired and that cellular service would terminate tonight. I followed the link airtel-kyc-verify.net and entered my phone number and netbanking login details. Soon after, my cellular service stopped working, and criminals accessed my banking accounts to siphon off 70,000 rupees.",
            "Filing a complaint regarding a fraudulent telecom eSIM transition notice. A caller claiming to represent Vodafone Idea directed me to vi-esim-activation.info to verify my identity. I entered my email address, phone number, and banking details. The attackers initiated a SIM swap, intercepted my banking OTPs, and transferred 92,000 rupees from my savings.",
            "A text message claimed that mandatory 5G SIM migration was required to prevent phone disconnection. The message directed me to telecom-kyc-update.org where I entered my personal identification and debit card details. My phone lost network signal an hour later, and unauthorized IMPS transfers emptied 64,000 rupees from my account.",
            "I received a message claiming that my mobile number was selected for complimentary high-speed data upgrade upon completing verification at mobile-network-update.com. The page captured my banking login credentials, after which my SIM card was blocked and 45,000 rupees was debited from my account.",
            "A telecom verification alert instructed me to complete biometric authentication at telco-verification-desk.net to avoid service interruption. I provided my personal details and debit card PIN. Fraudsters subsequently swapped my SIM card and executed unauthorized fund transfers totaling 78,000 rupees.",
            "I received a notification claiming that my prepaid cellular connection would be terminated due to incomplete customer verification. The link led to a spoofed telecom page that recorded my internet banking credentials, resulting in an unauthorized withdrawal of 50,000 rupees.",
            "An SMS claiming to be from BSNL customer service warned of imminent telephone disconnection unless verified at bsnl-kyc-portal.online. I submitted my account details and password. Attackers used this access to process unauthorized debits amounting to 35,000 rupees.",
            "A message warned that my corporate cellular connection required urgent subscriber profile re-validation. I accessed the link and provided confidential credentials, leading to immediate SIM suspension and unauthorized financial debits totaling 60,000 rupees.",
            "I was targeted by a telecom SMS stating my mobile number had multiple conflicting registrations. The link directed to a spoofed portal where I entered my banking login credentials, resulting in an unauthorized transfer of 40,000 rupees.",
            "Fake telecom notification urged me to convert my SIM to an eSIM via an online form. I entered my banking credentials, resulting in cellular disconnection and loss of 55,000 rupees from my account.",
            "An SMS claimed my cellular service was blocked due to regulatory non-compliance. I provided my netbanking credentials on the linked portal, and criminals drained 68,000 rupees from my savings balance."
        ],
        'concise': [
            "Fake 5G SIM upgrade SMS stole my personal credentials, resulting in SIM swap and unauthorized bank debits.",
            "Clicked telecom verification link, entered banking details, lost phone signal and suffered 70000 rupees fraud.",
            "Fraudulent telecom alert directed to spoofed portal that captured login credentials and initiated illegal transfers."
        ]
    },
    {
        'id': 'phishing_fam_06',
        'name': 'lottery_reward_points',
        'style': 'first_person_complaint',
        'narratives': [
            "I received a text alert stating that my credit card reward points worth 12,500 rupees were set to expire at midnight. The message directed me to reward-points-redeem.online to convert the points into direct bank cash. I entered my credit card number, CVV, and netbanking password on the form. Minutes later, an unauthorized transaction debited 45,000 rupees from my credit line instead of crediting money.",
            "An SMS claiming to be from my bank informed me that I had accumulated 9,800 loyalty reward points that could be transferred directly to my savings account. I followed the link bank-reward-claim.info and submitted my card credentials along with my ATM PIN. Fraudsters used the information to execute unauthorized point-of-sale debits totaling 58,000 rupees.",
            "Filing a cyber incident report regarding a fraudulent reward point redemption message. The notification arrived under a sender header resembling my bank, directing me to points-cash-portal.net. After I entered my netbanking login credentials and OTP, criminals initiated an unauthorized IMPS transfer of 36,000 rupees from my account.",
            "A text message congratulated me on winning a 25,000-rupee shopping voucher from a national retail chain, requiring redemption at voucher-reward-claim.org. The site prompted for my debit card details and CVV to verify shipping eligibility. Once submitted, 42,000 rupees was debited from my savings balance.",
            "I received an email stating that my credit card cashback rewards were ready for deposit and directed me to creditcard-cashback-desk.com. I provided my internet banking username and transaction password. Attackers accessed my profile and transferred 62,000 rupees to an external account.",
            "A notification claimed that my fuel reward points were expiring and directed me to redeem-fuel-points.net. After submitting my debit card credentials and mobile OTP, unauthorized transactions totaling 30,000 rupees debited my account.",
            "I received an SMS stating that 15,000 reward points from my airline loyalty program were available for immediate cash transfer. I followed the link and entered my banking credentials, leading to an unauthorized wire transfer of 48,000 rupees.",
            "A deceptive message informed me that my debit card had earned unredeemed bonus cash. I entered my banking login credentials at bonus-reward-claim.online, resulting in an unauthorized withdrawal of 34,000 rupees from my savings.",
            "An email regarding an annual customer appreciation prize directed me to a spoofed portal where I submitted my netbanking credentials. Criminals immediately debited 50,000 rupees from my bank account.",
            "A text alert stated that my credit card accumulated reward balance would be forfeited unless claimed at points-redeem-desk.info. I entered my card details and lost 40,000 rupees to unauthorized transactions.",
            "I received a message offering cash conversion of shopping points. The linked portal captured my debit card PIN, resulting in unauthorized ATM withdrawals totaling 28,000 rupees.",
            "A reward point redemption notification directed me to an external site. After I entered my banking credentials, an unauthorized wire transfer of 52,000 rupees was completed from my balance."
        ],
        'concise': [
            "Fake reward points expiration message directed me to a spoofed site that debited 45000 rupees from my card.",
            "Entered netbanking credentials on a loyalty reward redemption link and lost my savings to unauthorized transfers.",
            "Fraudulent credit card bonus points text stole my card CVV and password, executing unauthorized debits."
        ]
    },
    {
        'id': 'phishing_fam_07',
        'name': 'cloud_drive_sharing',
        'style': 'technical_incident_summary',
        'narratives': [
            "Our cybersecurity incident team investigated a credential theft attack initiated via a spoofed cloud storage sharing notification. An employee received an email stating that an external partner had shared an encrypted financial audit dossier on Google Drive. The link directed to drive-google-viewer.online, a replica of the Google authentication portal. The employee entered corporate credentials, which attackers used to access internal cloud storage and download confidential contract drafts.",
            "A technical report regarding a Dropbox credential harvesting incident. A project engineer received an email with the subject Project Specifications Shared with You. Clicking the embedded link opened a spoofed Dropbox authentication screen hosted at dropbox-shared-files.net. The engineer submitted login credentials, resulting in unauthorized access to our company technical drawings repository.",
            "An incident occurred where an employee received an automated notification claiming that a shared file was awaiting review on OneDrive. The URL directed to onedrive-file-share.info, which prompted for corporate email credentials. Attackers harvested the credentials and initiated unauthorized access to corporate SharePoint document libraries.",
            "Our security monitoring systems detected unauthorized outbound API requests following a cloud storage phishing attack. An accountant received an invoice notification linking to cloud-document-viewer.org, which captured their login credentials and enabled unauthorized exfiltration of internal accounting spreadsheets.",
            "A staff member fell victim to a deceptive email stating that a signed non-disclosure agreement was ready for download on an external cloud drive. The spoofed login form at document-vault-access.com recorded the user credentials, allowing unauthorized threat actors to access corporate cloud repositories.",
            "We detected compromised employee credentials following an email claiming to share legal discovery documents on Box. The link redirected to box-cloud-storage.net, harvesting the attorney login details and compromising sensitive legal case summaries.",
            "An employee received an email regarding an urgent corporate policy memo shared via a cloud document repository. The fake authentication screen captured corporate single sign-on credentials, resulting in unauthorized access to internal file servers.",
            "A cloud file-sharing notification mimicked our internal corporate intranet repository. A staff member entered their domain password on the spoofed landing page, enabling attackers to download proprietary product source code.",
            "Our IT desk identified a phishing email inviting an employee to collaborate on a shared financial model. The page captured user credentials, leading to an unauthorized session in our enterprise cloud storage environment.",
            "An unauthorized user accessed internal corporate folders after an employee entered credentials on a counterfeit file-sharing page disguised as an engineering design portal.",
            "A spoofed document sharing link captured an executive assistant credentials, leading to unauthorized downloading of corporate strategic planning documents.",
            "Threat actors deployed a fake Google Drive login portal that harvested credentials from two marketing personnel, compromising internal customer presentation materials."
        ],
        'concise': [
            "Spoofed cloud storage sharing email directed employee to fake login page that harvested corporate credentials.",
            "Entered domain credentials on a counterfeit Google Drive sharing link resulting in unauthorized cloud access.",
            "Deceptive file sharing notification captured corporate login details, allowing unauthorized document access."
        ]
    },
    {
        'id': 'phishing_fam_08',
        'name': 'social_media_account_warning',
        'style': 'first_person_complaint',
        'narratives': [
            "I received a direct message on Instagram from an account named Instagram Copyright Review stating that an image on my business profile violated intellectual property laws. The message warned that my account would be deleted within 24 hours unless I filed an appeal at instagram-copyright-appeal.online. I clicked the link and entered my Instagram username and password. Within ten minutes, my account password and recovery email were changed, and the hacker demanded 50,000 rupees to return it.",
            "An urgent notification appeared in my Twitter notifications claiming that my profile had been reported for hateful conduct. The link directed to twitter-account-review.net to verify my identity. I submitted my account credentials and two-factor backup code on the page. Attackers immediately hijacked my account and began posting fraudulent cryptocurrency promotion links to my followers.",
            "I am reporting an account takeover resulting from a spoofed Meta verification email. The message claimed that my Facebook business page was eligible for verified badge status via meta-verified-portal.org. I entered my business manager credentials on the form. The scammers locked me out of my page and launched unauthorized advertising campaigns using my linked credit card.",
            "A message received on LinkedIn claiming to be from the LinkedIn Security Team warned that suspicious login attempts had been detected on my profile. The link linkedin-security-verify.com prompted for my login credentials and phone number. Attackers accessed my profile, exported my professional contacts, and sent phishing messages to my network.",
            "I received an email stating that my YouTube creator channel was scheduled for demonetization due to copyright infringements unless appealed at youtube-partner-appeal.net. I entered my Google account credentials on the form, after which my channel was hijacked and rebranded to stream fraudulent investment schemes.",
            "A notification claiming that my TikTok account was flagged for community guidelines violations instructed me to appeal at tiktok-support-appeal.info. I entered my login credentials, leading to complete account takeover and deletion of my uploaded content.",
            "I received an Instagram DM warning that my personal profile had been flagged for impersonation. I followed the appeal link and entered my password, resulting in the account being hijacked and used to solicit money from my friends.",
            "An email regarding an urgent security audit on my Facebook account directed me to a fake login portal. After entering my password, the attackers took over my personal profile and messaged contacts requesting urgent emergency loans.",
            "A deceptive message claimed my Twitter account was selected for priority verification. The spoofed authentication page captured my credentials, allowing scammers to take control of my handle and post spam.",
            "I was directed to a fake social media appeal portal after receiving a message claiming my account violated terms of service. My credentials were stolen, and the page was hijacked for extortion.",
            "A fraudulent copyright infringement notice on Instagram led me to a fake appeal form where I entered my password, resulting in immediate account takeover.",
            "I lost access to my business social media account after submitting login credentials on a spoofed verification link sent by an impersonator."
        ],
        'concise': [
            "Fake Instagram copyright violation message led to a phishing page that hijacked my account and recovery details.",
            "Entered Twitter credentials on a spoofed account appeal link, leading to profile takeover and crypto spam.",
            "Deceptive social media verification message captured my login details and locked me out of my business profile."
        ]
    },
    {
        'id': 'phishing_fam_09',
        'name': 'job_recruitment_portal',
        'style': 'first_person_complaint',
        'narratives': [
            "I applied for an administrative position on an online job board and received an email from a recruiter claiming to represent an international consulting firm. The email instructed me to complete an employee onboarding profile and background verification at career-consulting-portal.online. On the site, I submitted my Aadhaar number, PAN card details, and netbanking credentials for salary direct deposit setup. Shortly afterward, an unauthorized transaction debited 46,000 rupees from my savings.",
            "A fraudulent job offer letter arrived in my email claiming I was selected for a remote data entry specialist role with an IT enterprise. The email directed me to corporate-careers-onboarding.info to complete security clearance. The portal asked for my banking credentials and debit card details to verify address documentation. Within an hour, 35,000 rupees was debited from my account without authorization.",
            "Filing a cyber complaint regarding a recruitment phishing scam. An email claiming to be from a reputed healthcare company invited me for an interview and requested verification of educational credentials at healthcare-jobs-verify.net. I entered my personal identification and internet banking credentials, resulting in an unauthorized IMPS transfer of 52,000 rupees.",
            "I received an invitation for an overseas employment opportunity requiring registration at international-careers-desk.org. The form requested confidential personal documents and banking login credentials to verify financial solvency. Attackers used this access to withdraw 40,000 rupees from my bank account.",
            "A recruitment notification claiming to represent a multinational airline offered a flight operations role and directed me to aviation-recruitment-portal.com. The spoofed website captured my debit card number and ATM PIN under the guise of an assessment fee, draining 60,000 rupees from my account.",
            "I was contacted via email regarding a government contractor job vacancy. The recruiter sent a link to an official-looking candidate verification portal where I input my banking login details, leading to an unauthorized transfer of 38,000 rupees.",
            "A job offer email for a software engineering position directed me to verify my identity on a third-party portal. I entered my netbanking credentials, and fraudsters subsequently transferred 48,000 rupees out of my savings balance.",
            "I received an email claiming my resume was shortlisted for an executive role and instructed me to complete identity verification at career-portal-desk.net. After providing my card details, 32,000 rupees was debited from my account.",
            "A recruiter message on a job forum linked to a spoofed hiring portal requiring banking credentials for salary verification. I submitted the form, resulting in unauthorized transactions totaling 55,000 rupees.",
            "I fell victim to a fake recruitment email that required bank account details to disburse a signing bonus. The portal captured my login credentials, leading to a loss of 42,000 rupees.",
            "A job application site requested my netbanking credentials to verify account status for remote work stipend. Minutes after submission, 29,000 rupees was debited from my account.",
            "An employment offer required me to complete identity verification on a fake corporate portal. I entered my banking login details, and criminals emptied 50,000 rupees from my savings."
        ],
        'concise': [
            "Fake job offer email directed me to an onboarding portal that captured my netbanking credentials and debited 46000 rupees.",
            "Entered banking login details on a recruitment verification website and suffered unauthorized fund transfers.",
            "Fraudulent employment onboarding site stole my debit card credentials and drained funds from my savings."
        ]
    }
]

def get_samples():
    samples = []
    for fam in FAMILIES:
        for text in fam['narratives']:
            samples.append({
                'text': text,
                'is_narrative': True,
                'scenario_family': fam['name'],
                'lineage_id': fam['id'],
                'narrative_style': fam['style'],
                'word_count': len(text.split())
            })
        for text in fam['concise']:
            samples.append({
                'text': text,
                'is_narrative': False,
                'scenario_family': fam['name'],
                'lineage_id': fam['id'],
                'narrative_style': 'concise_report',
                'word_count': len(text.split())
            })
    return samples

def get_narratives():
    res = []
    for fam in FAMILIES:
        res.extend(fam['narratives'])
    return res

def get_concise():
    res = []
    for fam in FAMILIES:
        res.extend(fam['concise'])
    return res

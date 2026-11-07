# GymOS: Android और iPhone ऐप

ऐप का असली कोड `../public` में है। यह फ़ोल्डर उसी को Android और iOS के स्टोर-ऐप में लपेटता है (Capacitor)। ऐप के साथ सभी फ़ाइलें ऐप के अंदर रहती हैं, लेकिन डेटा हमेशा इंटरनेट से Supabase से आता है।

## तीन रास्ते (आसान से कठिन)

1. **वेबसाइट से इंस्टॉल (अभी, मुफ़्त):** Android Chrome में साइट खोलें, "Install" दबाएँ। iPhone Safari में Share → "Add to Home Screen"। कोई खाता नहीं चाहिए।
2. **Android APK (मुफ़्त):** GitHub → Actions → "Mobile apps" → Run workflow। पूरा होने पर `GymOS-android-debug-apk` डाउनलोड करें और फ़ोन में इंस्टॉल करें (फ़ोन में "अज्ञात स्रोत से इंस्टॉल" की अनुमति देनी होगी)।
3. **Play Store / App Store:** नीचे की ज़रूरतें पूरी करनी होंगी।

## स्टोर के लिए आपको क्या चाहिए (मैं ये नहीं कर सकता)

**Google Play:** Play Console खाता (एक बार ₹2,000 के आसपास, $25)। साइनिंग की (keystore) बनाइए:
`keytool -genkeypair -v -keystore upload.jks -alias gymos -keyalg RSA -keysize 2048 -validity 10000`
इस फ़ाइल और पासवर्ड को संभालकर रखें, खो गई तो ऐप अपडेट नहीं हो पाएगा। फिर GitHub → Settings → Secrets में ये चार जोड़ें: `ANDROID_KEYSTORE_BASE64` (फ़ाइल का base64), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`। अब workflow `GymOS-android-release-aab` भी बनाएगा। उसे Play Console में अपलोड करें।

**Apple App Store:** Apple Developer खाता ($99 हर साल)। iOS ऐप साइन करने के लिए Apple का सर्टिफ़िकेट और प्रोफ़ाइल चाहिए। मौजूदा workflow सिर्फ़ जाँचता है कि iOS ऐप बन रहा है (सिमुलेटर के लिए, बिना साइन)। App Store/TestFlight अपलोड के लिए Mac पर Xcode में `npm run ios:add` के बाद `ios/App` खोलकर Signing में अपनी Team चुनें और Archive करें, या Codemagic/EAS जैसी सेवा जोड़ें।

## ध्यान रखने की बातें

- ऐप का नाम और आईडी `capacitor.config.json` में है: `in.royalthegym.gymos`। **पहली बार स्टोर पर डालने से पहले** इसे तय कर लें, बाद में बदलना मुश्किल है।
- Apple ऐसे ऐप ठुकरा देता है जो सिर्फ़ वेबसाइट का रैपर हों (गाइडलाइन 4.2)। यह ऐप सदस्य, भुगतान, स्टोर, चेक-इन जैसे असली काम करता है, पर समीक्षा में आपको ऐप का मक़सद साफ़ लिखना होगा और समीक्षक के लिए एक डेमो लॉगिन देना होगा।
- स्टोर में डालने के लिए "प्राइवेसी पॉलिसी" का पेज और स्टोर के स्क्रीनशॉट आपको देने होंगे।
- वेब कोड बदलने पर नया स्टोर-वर्ज़न बनाना पड़ेगा। वेबसाइट (PWA) वाला रास्ता अपने-आप अपडेट होता है।
- यह workflow अभी तक GitHub पर चलाकर जाँची नहीं गई है। पहली बार चलाने पर कोई कदम फ़ेल हो सकता है, तब उसका लॉग भेज दें।

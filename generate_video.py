import os
import requests
from openai import OpenAI
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips, TextClip, CompositeVideoClip
import time

# Ensure API keys are set as environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

if not OPENAI_API_KEY or not ELEVENLABS_API_KEY:
    print("Please set OPENAI_API_KEY and ELEVENLABS_API_KEY environment variables.")
    print("Example:")
    print("export OPENAI_API_KEY='your_openai_api_key'")
    print("export ELEVENLABS_API_KEY='your_elevenlabs_api_key'")
    exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)

# ElevenLabs Settings
ELEVENLABS_VOICE_ID = "pNInz6obpgDQGcFmaJcg" # Example Voice ID (Adam - deep voice). You can change this.
ELEVENLABS_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": ELEVENLABS_API_KEY
}

prompts_data = [
    {
        "id": 1,
        "title": "सतयुग का आरंभ",
        "scene": "सतयुग का स्वर्णिम युग, तीनों लोकों में शांति, स्वर्गलोक में देवता प्रसन्न मुद्रा में, पृथ्वी पर धर्म की ध्वजा लहरा रही है, दिव्य प्रकाश, स्वर्णिम आकाश, पवित्र वातावरण, सिनेमैटिक वाइड एंगल, अल्ट्रा डिटेल, पौराणिक भारतीय शैली, 4K।",
        "narration": "सतयुग का समय था। तीनों लोकों में शांति व्याप्त थी। देवता अपने लोकों में सुखपूर्वक निवास कर रहे थे और पृथ्वी पर धर्म की ध्वजा लहरा रही थी। ऐसा प्रतीत होता था मानो सम्पूर्ण सृष्टि आनंद और संतुलन में डूबी हुई हो।"
    },
    {
        "id": 2,
        "title": "मुरासुर का जन्म",
        "scene": "अंधकारमय दानव लोक, लाल अग्नि की लपटें, नवजात असुर की चमकती लाल आंखें, चारों ओर भयावह ऊर्जा, रहस्यमय वातावरण, सिनेमैटिक क्लोजअप।",
        "narration": "लेकिन उसी समय दानव कुल में एक ऐसे असुर का जन्म हुआ जिसकी आंखों में जन्म से ही अग्नि जल रही थी। उसका नाम था मुरासुर। बचपन से ही उसके हृदय में एक ही इच्छा थी — देवताओं को पराजित कर सम्पूर्ण ब्रह्मांड पर अधिकार स्थापित करना।"
    },
    {
        "id": 3,
        "title": "मुरासुर की महत्वाकांक्षा",
        "scene": "युवा मुरासुर पर्वत शिखर पर खड़ा, आकाश की ओर देखते हुए, पीछे बिजली चमक रही है, शक्तिशाली दानव सेना की कल्पना, सिनेमैटिक वातावरण।",
        "narration": "जैसे-जैसे मुरासुर बड़ा होता गया, उसकी शक्ति और उसका अहंकार दोनों बढ़ते गए। वह आकाश की ओर देखकर कहा करता था — एक दिन मैं देवताओं को उनके सिंहासन से नीचे गिरा दूंगा।"
    },
    {
        "id": 4,
        "title": "हिमालय की तपस्या",
        "scene": "हिमालय की बर्फीली गुफाएं, तपस्या में लीन मुरासुर, वर्षों का समय बीतता हुआ, सूखा शरीर, दिव्य ऊर्जा का संचार, बर्फीला वातावरण।",
        "narration": "अमरता प्राप्त करने की इच्छा से मुरासुर हिमालय की गुफाओं में चला गया। उसने वर्षों तक कठोर तपस्या की। न अन्न ग्रहण किया, न जल पिया। उसका शरीर सूख गया, लेकिन उसका संकल्प अडिग रहा।"
    },
    {
        "id": 5,
        "title": "ब्रह्माजी का प्रकट होना",
        "scene": "तेजस्वी प्रकाश, कमल पर विराजमान ब्रह्माजी, स्वर्णिम आभा, आकाश में दिव्य ऊर्जा का विस्फोट।",
        "narration": "अंततः उसकी तपस्या से प्रसन्न होकर स्वयं भगवान ब्रह्मा प्रकट हुए। उनकी दिव्य आभा से सम्पूर्ण आकाश प्रकाशित हो उठा।"
    },
    {
        "id": 6,
        "title": "वरदान प्राप्ति",
        "scene": "मुरासुर ब्रह्माजी के सामने झुका हुआ, वरदान प्राप्त करता हुआ, चारों ओर दिव्य ऊर्जा।",
        "narration": "मुरासुर ने ऐसा वरदान मांगा कि कोई देवता, दानव, मनुष्य अथवा अस्त्र-शस्त्र उसका अंत न कर सके। ब्रह्माजी ने नियमवश उसे वह वरदान प्रदान कर दिया।"
    },
    {
        "id": 7,
        "title": "स्वर्ग पर आक्रमण",
        "scene": "विशाल दानव सेना, स्वर्गलोक पर हमला, आकाश में युद्ध, बिजली, अग्नि और विनाश।",
        "narration": "वरदान प्राप्त करते ही मुरासुर का अत्याचार आरंभ हो गया। उसने स्वर्गलोक पर आक्रमण कर दिया। देवताओं और दानवों के मध्य भयंकर युद्ध छिड़ गया।"
    },
    {
        "id": 8,
        "title": "देवताओं की हार",
        "scene": "इंद्र का वज्र, अग्नि देव की अग्निवर्षा, वरुण का जल प्रलय, लेकिन मुरासुर अडिग खड़ा है।",
        "narration": "इंद्र का वज्र, अग्निदेव की अग्निवर्षा और वरुणदेव का जलप्रलय भी मुरासुर को रोक न सके। कुछ ही समय में देवता पराजित हो गए।"
    },
    {
        "id": 9,
        "title": "कैलाश पर देवता",
        "scene": "कैलाश पर्वत, भगवान शिव ध्यान मुद्रा में, देवता विनम्रता से सहायता मांगते हुए।",
        "narration": "पराजित देवता कैलाश पहुंचे और भगवान शिव से सहायता की प्रार्थना करने लगे।"
    },
    {
        "id": 10,
        "title": "क्षीरसागर में विष्णु",
        "scene": "क्षीरसागर, शेषनाग पर विराजमान भगवान विष्णु, लक्ष्मीजी समीप, दिव्य प्रकाश।",
        "narration": "भगवान शिव के निर्देश पर सभी देवता क्षीरसागर पहुंचे और भगवान विष्णु से अपनी व्यथा सुनाई।"
    },
    {
        "id": 11,
        "title": "विष्णु और मुरासुर का महासंग्राम",
        "scene": "भगवान विष्णु गरुड़ पर सवार, सुदर्शन चक्र, अग्निबाण, विशाल युद्ध, ब्रह्मांडीय ऊर्जा।",
        "narration": "स्वर्गलोक में भगवान विष्णु और मुरासुर के बीच वर्षों तक चलने वाला महायुद्ध आरंभ हुआ।"
    },
    {
        "id": 12,
        "title": "सिंहावती गुफा",
        "scene": "हिमालय की रहस्यमयी गुफा, भगवान विष्णु योगनिद्रा में, बर्फीला वातावरण।",
        "narration": "रणनीति के अंतर्गत भगवान विष्णु उत्तर दिशा की ओर बढ़े और सिंहावती नामक गुफा में योगनिद्रा में लीन हो गए।"
    },
    {
        "id": 13,
        "title": "एकादशी देवी का प्राकट्य",
        "scene": "विष्णु के शरीर से निकलता दिव्य प्रकाश, तेजस्वी देवी प्रकट होती हुईं, आकाशीय ऊर्जा।",
        "narration": "जैसे ही मुरासुर ने भगवान विष्णु पर प्रहार करना चाहा, उसी क्षण प्रभु के शरीर से एक अद्भुत तेजस्वी देवी प्रकट हुईं।"
    },
    {
        "id": 14,
        "title": "देवी और मुरासुर का युद्ध",
        "scene": "एकादशी देवी और मुरासुर का भीषण युद्ध, दिव्य अस्त्र, अग्नि और प्रकाश का संग्राम।",
        "narration": "देवी और मुरासुर के मध्य भयंकर युद्ध आरंभ हुआ। देवी की गति और शक्ति के सामने मुरासुर टिक नहीं सका।"
    },
    {
        "id": 15,
        "title": "मुरासुर का अंत",
        "scene": "देवी की दिव्य तलवार, मुरासुर का अंत, प्रकाश का विस्फोट, धरती कांपती हुई।",
        "narration": "एक ही प्रहार में देवी ने मुरासुर का सिर धड़ से अलग कर दिया। उसी क्षण अधर्म का अंत हो गया।"
    },
    {
        "id": 16,
        "title": "एकादशी नामकरण",
        "scene": "भगवान विष्णु देवी को आशीर्वाद देते हुए, देवताओं द्वारा पुष्पवर्षा, स्वर्गीय प्रकाश।",
        "narration": "भगवान विष्णु ने प्रसन्न होकर कहा — देवी, आज से तुम्हारा नाम एकादशी होगा। जो भी भक्त श्रद्धा से एकादशी का व्रत करेगा, उसे मेरे धाम की प्राप्ति होगी।"
    },
    {
        "id": 17,
        "title": "समापन",
        "scene": "देवताओं की पुष्पवर्षा, भगवान विष्णु, एकादशी माता, स्वर्णिम आकाश, दिव्य प्रकाश, आध्यात्मिक समापन।",
        "narration": "उस दिन सम्पूर्ण सृष्टि ने देखा कि जब अधर्म अपने अहंकार में अंधा हो जाता है, तब भगवान ऐसी लीला रचते हैं जिसकी कल्पना स्वयं देवता भी नहीं कर सकते। यही कारण है कि आज भी एकादशी भगवान विष्णु की सर्वप्रिय तिथि मानी जाती है। जय श्री हरि विष्णु।"
    }
]

def generate_image(prompt, filename):
    if os.path.exists(filename):
        print(f"Image {filename} already exists. Skipping generation.")
        return
    print(f"Generating image for: {prompt[:50]}...")
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt + " Please make the image look highly cinematic, 4K resolution, suitable for a dark mystical mythological short video.",
            size="1024x1024",
            quality="standard",
            n=1,
        )
        image_url = response.data[0].url
        img_data = requests.get(image_url).content
        with open(filename, 'wb') as handler:
            handler.write(img_data)
        print(f"Saved {filename}")
    except Exception as e:
        print(f"Error generating image: {e}")

def generate_audio(text, filename):
    if os.path.exists(filename):
        print(f"Audio {filename} already exists. Skipping generation.")
        return
    print(f"Generating audio for: {text[:30]}...")

    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    response = requests.post(ELEVENLABS_URL, json=data, headers=headers)

    if response.status_code == 200:
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)
        print(f"Saved {filename}")
    else:
        print(f"Error generating audio: {response.text}")

def create_video():
    if not os.path.exists("assets"):
        os.makedirs("assets")

    clips = []

    print("--- Starting Media Generation ---")
    for item in prompts_data:
        idx = item["id"]
        img_file = f"assets/scene_{idx}.png"
        audio_file = f"assets/audio_{idx}.mp3"

        generate_image(item["scene"], img_file)
        generate_audio(item["narration"], audio_file)

        if os.path.exists(img_file) and os.path.exists(audio_file):
            # Create Audio Clip
            audio_clip = AudioFileClip(audio_file)

            # Create Image Clip, set duration to audio duration
            # Zoom effect can be added here if needed, keeping it simple for now
            img_clip = ImageClip(img_file).set_duration(audio_clip.duration)

            # Combine Image and Audio
            video_clip = img_clip.set_audio(audio_clip)
            clips.append(video_clip)

    print("--- Combining Video Clips ---")
    if clips:
        final_video = concatenate_videoclips(clips, method="compose")
        # Ensure 16:9 for Youtube Shorts (1080x1920) or standard 1920x1080.
        # DALL-E generates 1024x1024. Resizing for simple output.
        final_video.write_videofile("Ekadashi_Katha_Final.mp4", fps=24)
        print("Video successfully generated: Ekadashi_Katha_Final.mp4")
    else:
        print("No clips generated. Check API keys and errors above.")

if __name__ == "__main__":
    create_video()

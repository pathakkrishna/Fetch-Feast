import re

with open('index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all variations of the dark blue/purple heading colors with Apple dark gray #1d1d1f
colors_to_replace = ['#2e2770', '#1f1a3d', '#2a2550', '#4a4563']
for color in colors_to_replace:
    # case-insensitive replace
    content = re.sub(color, '#1d1d1f', content, flags=re.IGNORECASE)

# Make the hero-premium banner look like other pages instead of an image background
hero_css_old = r'''.hero-premium \{
  background-image: linear-gradient\(rgba\(0, 0, 0, 0\.3\), rgba\(0, 0, 0, 0\.7\)\), url\('/assets/hero_food_image_[0-9]+\.png'\);
  background-size: cover;
  background-position: center;
  border-radius: 24px;
  padding: 4rem 2rem;
  color: white;
  margin-bottom: 2rem;
  box-shadow: 0 20px 40px rgba\(103, 62, 237, 0\.2\);
\}
.hero-content-box \{ text-align: center; \}
.hero-content-box h2 \{ font-size: 3rem; margin: 0 0 1rem; color: white; text-shadow: 0 4px 10px rgba\(0,0,0,0\.3\); \}
.hero-content-box p \{ font-size: 1\.2rem; margin: 0 0 2rem; opacity: 0\.9; \}
.hero-stats-row \{ display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; \}
.hero-stat-pill \{ background: rgba\(255,255,255,0\.2\); backdrop-filter: blur\(10px\); padding: 0\.5rem 1rem; border-radius: 50px; font-weight: 500; font-size: 0\.9rem; text-align: center; \}'''

hero_css_new = '''.hero-premium {
  background: white;
  border-radius: 24px;
  padding: 3rem 2rem;
  color: #1d1d1f;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid #f9f7fc;
}
.hero-content-box { text-align: center; }
.hero-content-box h2 { font-size: 2.8rem; margin: 0 0 1rem; color: #1d1d1f; }
.hero-content-box p { font-size: 1.1rem; margin: 0 0 2rem; color: #515154; }
.hero-stats-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; }
.hero-stat-pill { background: #f6f8f5; border: 1px solid #e2ede0; color: #53694f; padding: 0.5rem 1rem; border-radius: 50px; font-weight: 600; font-size: 0.9rem; text-align: center; }'''

content = re.sub(hero_css_old, hero_css_new, content)

with open('index.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done applying colors!')

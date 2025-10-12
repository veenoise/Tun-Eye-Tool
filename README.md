
# TUN-EYE: Fake News Detector

Tun-Eye is a fake news detection web extension that analyzes both text and images using the Gemini API and a Flask-powered backend. It helps users quickly assess the credibility of online Philippine political content, offering real-time insights directly within the browser.

Tun-Eye is designed for:

* 🧑‍🎓 Students and researchers verifying online sources for academic work

* 🧑‍💼 Journalists and media professionals assessing the credibility of news content

* 🌐 Everyday internet users who want to avoid misinformation on social media or news sites

* 🛡️ Fact-checkers and educators promoting media literacy and digital safety

It's a tool for anyone who wants to stay informed and think critically about the content they encounter online.



## Authors

- [William Eduard Chua](https://github.com/veenoise)
- [Jason Espallardo](https://github.com/Shifard)
- [Whayne Tyrece Tan](https://github.com/TyreceT)
- [Nigel Frederick Torres](https://github.com/Gelly-Tr33s)
- [Jedric Knight Vicente](https://github.com/KnightVicente)


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`GEMINI_API_KEY`

There is a sample file located at `backend/.env.sample`, make a copy of that and rename it to `.env`. Then modify the gemini key with your own.
## Installation

1. Install the web extension by opening the browser settings
2. Click on `Extensions`
3. Click on `Manage extensions`
4. Enable `Developer mode`
5. Click `Load unpacked`
6. Select the directory of this project in `Tun-Eye-Tool/Tun-Eye`
## Deployment

Ensure you are in a virtual environment. If you have no `.venv` file in `/Tun-Eye-Tool/backend`, create one using

```bash
python -m venv .venv
```

Activate this virtual environment

```bash
source .venv/bin/activate     # In Linux

.venv\Scripts\activate     # In Windows
```

Install the required dependencies

```bash
pip install -r requirements.txt
```

Load the model. Do this in Linux/MacOS or Git Bash (Windows)

```bash
cat model_part* > model.zip
unzip model.zip
```

To deploy run the backend API, make sure that you are in the `Tun-Eye-Tool/backend` directory and run 

```bash
python distilmbert.py
```

or

```bash
python adaboost_rf.py
```
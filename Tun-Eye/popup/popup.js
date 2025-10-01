const content = document.querySelector('.content');
const body = document.querySelector('body');
const mainInterface = document.querySelector('#main-interface');
const settingsInterface = document.querySelector('#settings-interface');
const breakdownInterface = document.querySelector('#breakdown-interface');
const submitBtn = document.querySelector('#submit');

// Resize window
const newHeight = window.outerHeight - window.innerHeight + 523;
const newWidth = window.outerWidth;
window.resizeTo(newWidth, newHeight);

// Load preview to user
chrome.storage.local.get(null).then(res => {
    switch (res.type) {
        case 'text':
            content.textContent = res.value;
            break;
        case 'image':
            content.innerHTML = `
                <img src="${res.value}" style="object-fit:contain; width:100%; height: 100%; display:block;" />
            `;
            break;
        default:
            content.textContent = 'Error: Invalid type';
            break;
    }

    // Set default behavior for extension
    if (!('enableExtension' in res)) {
        chrome.storage.local.set({
            ...res,
            'enableExtension': true
        })
    }

    // To respect user privacy and choice, set enableRecord to false
    if (!('enableRecord' in res)) {
        chrome.storage.local.set({
            ...res,
            'enableExtension': false
        })
    }

    // Disable submission if enableExtension is set to false
    if ('enableExtension' in res && res.enableExtension === false) {
        submitBtn.classList.add('submit-disabled', 'disabled');
        submitBtn.disabled = true;
    }

    // Listen to chrome storage changes to modify submitBtn
    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (namespace === "local" && key == 'enableExtension' && newValue === true) {
                submitBtn.classList.remove('submit-disabled', 'disabled');
                submitBtn.disabled = false;
            } else if (namespace === "local" && key == 'enableExtension' && newValue === false) {
                submitBtn.classList.add('submit-disabled', 'disabled');
                submitBtn.disabled = true;
            }
        }
    })

    // Submit data on click
    submitBtn.addEventListener('click', (e) => {
        const scanStep = document.querySelector('.default');
        const answerBtn = document.querySelector('.answer');
        const circleSym = document.querySelector('.symbol');

        e.currentTarget.classList.add("hidden");
        scanStep.classList.remove("hidden");
        answerBtn.classList.add('hidden');

        // Call flask API
        fetch("http://127.0.0.1:1234/api/process", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(res)
        })
            .then(res => {
                return res.json();
            })
            .then(output => {
                console.log(output);

                scanStep.classList.add("hidden");
                answerBtn.classList.remove('hidden');
                answerBtn.childNodes[1].childNodes[2].textContent = output['verdict'];

                // Change symbol color
                if (output['verdict'] === "Fake") {
                    circleSym.style.backgroundColor = "#F7BF2D";
                } else if (output['verdict'] === "Real") {
                    circleSym.style.backgroundColor = "#035EE6";
                }

                // Populate the result to chart js
                console.log(output.words.map(item => item.word))
                console.log(output.words.map(item => item.weight))
                callChartJs(output.words.map(item => item.word), output.words.map(item => item.weight));

                // When user clicks how, it shows the breakdown interface
                document.querySelector('.breakdown').addEventListener('click', () => {
                    mainInterface.classList.add('hidden');
                    settingsInterface.classList.add('hidden');
                    breakdownInterface.classList.remove('hidden');
                })

                // When user clicks go back, it returns to the main interface
                document.querySelector('#goBack').addEventListener('click', () => {
                    mainInterface.classList.remove('hidden');
                    settingsInterface.classList.add('hidden');
                    breakdownInterface.classList.add('hidden');
                })
            })
            .catch(err => {
                console.error(`Error encountered:\n------------------------------\n${err}`)
            })
    })
})


// Settings interface
const enableExtension = document.querySelector('#enable-extension');
const enableRecord = document.querySelector('#enable-record');
const doneBtn = document.querySelector('.done');
document.querySelectorAll('.settings').forEach(settings => {
    settings.addEventListener('click', () => {
        body.style.backgroundColor = "#2D2D51";
        mainInterface.classList.add('hidden');
        breakdownInterface.classList.add('hidden');
        settingsInterface.classList.remove('hidden');

        // Apply previous user settings
        chrome.storage.local.get(null)
            .then(res => {
                enableExtension.checked = !!res.enableExtension;
                enableRecord.checked = !!res.enableRecord;

                // Return to main interface from settings
                doneBtn.addEventListener('click', () => {
                    chrome.storage.local.set({
                        ...res,
                        "enableExtension": enableExtension.checked,
                        "enableRecord": enableRecord.checked
                    })

                    mainInterface.classList.remove('hidden');
                    settingsInterface.classList.add('hidden');
                    breakdownInterface.classList.add('hidden');

                    body.style.backgroundColor = "#039BE6";
                })
            })
    })
})


function callChartJs(words, values) {
    // chart
    const ctx = document.getElementById('chartBreakdown').getContext('2d');

    const data = {
        labels: words,
        datasets: [{
            label: 'Confidence Score',
            data: values,  // Negative left, Positive right
            backgroundColor: values.map(val => val < 0 ? '#F7BF2D' : '#035EE6'),  // Red for Fake, Blue for Real
        }]
    };

    const options = {
        indexAxis: 'y', // Horizontal bars
        scales: {
            x: {
                min: -1,  // Force axis to center at 0
                max: 1,
                grid: {
                    color: (context) => context.tick.value === 0 ? 'white' : 'transparent',
                    lineWidth: (context) => context.tick.value === 0 ? 2 : 0,
                    drawTicks: true

                },
                ticks: {
                    callback: function (value) {
                        return (value > 0 ? '+' : '') + value;
                    },
                    color: "white"
                }
            },
            y: {
                grid: {
                    drawBorder: false,
                },
                ticks: {
                    color: 'white'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: ctx => {
                        return `${ctx.dataset.label}: ${ctx.raw}`;
                    }
                }
            },
            title: {
                display: true,
                text: 'Fake                  Neutral                  Real',
                font: {
                    size: 14
                },
                padding: {
                    top: 10,
                    bottom: 20
                },
                color: "white"
            }

        }
    };

    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options,
    });
}

// Open dashboard in new tab
document.addEventListener("DOMContentLoaded", () => {
    const dashboardBtn = document.getElementById("dashboardBtn");

    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", () => {
            chrome.tabs.create({
                url: chrome.runtime.getURL("page.html")
            });
        });
    }
});
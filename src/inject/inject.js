let CRYPTOS_DATA = {};
let FOCUS_ON_TOOLTIP = false;

const intlFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const getHtmlTemplate = function(currency, price) {
  const urlCMC = `https://coinmarketcap.com/currencies/${currency.CoinName}`;
  const urlBitgur = `https://bitgur.com/coin/${currency.Name}`;

  // <canvas id="crypto-chart" width="300" height="250"></canvas>
  return `
    <p>
        <h2><img src="https://www.cryptocompare.com${currency.ImageUrl}" width="30" /> ${currency.CoinName}</h2>
    </p>
    <p>
        ${intlFormatter.format(price.USD)}
    </p>
    <p>
	<a class="crypto-website" href="${urlCMC}" target="_blank">See on CoinMarketCap</a>
	</p>
	    <p>
	<a class="crypto-website" href="${urlBitgur}" target="_blank">See on Bitgur</a>
	</p>
  `
}

// Functions
const displayTooltipOnCashtag = function(event, template) {
  const currencyTag = event.target.innerHTML.toUpperCase();

  if (!CRYPTOS_DATA[currencyTag]) {
    return;
  }

  const currency = CRYPTOS_DATA[currencyTag];
  event.target.style.cursor = "progress";
  const getPrice = fetch(`https://min-api.cryptocompare.com/data/price?fsym=${currencyTag}&tsyms=USD`).then(response => response.json());
  // const getHistory = fetch(`https://min-api.cryptocompare.com/data/histohour?fsym=${currencyTag}&tsym=USD&limit=24&aggregate=1`).then(response => response.json());

  Promise.all([
    getPrice,
    // getHistory
  ]).then(responses => {
    const price = responses[0];
    /*
    const history = responses[1];
    console.log(history);
    */

    // Template
    event.target.style.cursor = "auto";
    template.innerHTML = getHtmlTemplate(currency, price);
    template.style.visibility = "visible";
    template.style.top = `${event.pageY-10}px`;
    template.style.left = `${event.pageX-10}px`;
  })
}

const hideTooltip = function(event, template, timeout = 0) {
  setTimeout(() => {
    if (!FOCUS_ON_TOOLTIP) {
      template.style.visibility = "hidden";
    }
  }, timeout);
}

const liveListener = function(eventType, elementQuerySelector, cb) {
  document.addEventListener(eventType, function (event) {

    const qs = document.querySelectorAll(elementQuerySelector);

    if (qs) {
      let el = event.target, index = -1;
      while (el && ((index = Array.prototype.indexOf.call(qs, el)) === -1)) {
        el = el.parentElement;
      }

      if (index > -1) {
        cb.call(el, event);
      }
    }
  });
}

// Init extensions
chrome.extension.sendMessage({}, function (response) {
  const readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      // ----------------------------------------------------------
      // This part of the script triggers when page is done loading
      console.log("Crypthover extension activated");
      // ----------------------------------------------------------

      // Inject HTML
      const template = document.createElement('div');
      template.className = "crypthover"
      document.body.appendChild(template);

      template.addEventListener("mouseover", () => {
        FOCUS_ON_TOOLTIP = true;
      })
      template.addEventListener("mouseout", () => {
        FOCUS_ON_TOOLTIP = false;
        hideTooltip(event, template);
      })

      // Get crypto datas
      fetch('https://min-api.cryptocompare.com/data/all/coinlist')
        .then(response => response.json())
        .then(json => {
          CRYPTOS_DATA = json.Data;

          // Add event listener
          liveListener("mouseover", ".twitter-cashtag, .twitter-hashtag, .link-complex", (event) => displayTooltipOnCashtag(event, template))
          liveListener("mouseout", ".twitter-cashtag, .twitter-hashtag, .link-complex", (event) => hideTooltip(event, template, 500))
        })
    }
  }, 10);
});

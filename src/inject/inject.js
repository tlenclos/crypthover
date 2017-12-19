var CRYPTOS_DATA = {};
var FOCUS_ON_TOOLTIP = false;

const intlFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const getHtmlTemplate = function(currency, price) {
  console.log(currency);

  const url = `https://www.cryptocompare.com/coins/${currency.Name}/overview`;

  return `
    <p>
        <h2><img src="https://www.cryptocompare.com${currency.ImageUrl}" width="30" /> ${currency.CoinName}</h2>
    </p>
    <p>
        ${price.EUR}€<br />
        ${intlFormatter.format(price.USD)}
    </p>
    <p><a class="crypto-website" href="${url}" target="_blank">See on cryptocompare</a></p>
  `
}

// Functions
const displayTooltipOnCashtag = function(event, template) {
  console.log('event', event.target.innerHTML);
  const currencyTag = event.target.innerHTML;

  if (!CRYPTOS_DATA[currencyTag]) {
    return;
  }

  const currency = CRYPTOS_DATA[currencyTag];
  event.target.style.cursor = "progress";
  fetch(`https://min-api.cryptocompare.com/data/price?fsym=${currencyTag}&tsyms=USD,EUR`)
    .then(response => response.json())
    .then(price => {
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

    var qs = document.querySelectorAll(elementQuerySelector);

    if (qs) {
      var el = event.target, index = -1;
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
        console.log(FOCUS_ON_TOOLTIP);
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
          liveListener("mouseover", ".twitter-cashtag", (event) => displayTooltipOnCashtag(event, template))
          liveListener("mouseout", ".twitter-cashtag", (event) => hideTooltip(event, template, 500))
        })
    }
  }, 10);
});

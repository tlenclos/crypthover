var CRYPTOS_DATA = {};

const intlFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const getHtmlTemplate = function(currency, price) {
  console.log(currency);

  return `
    <p>
        <h2><img src="https://www.cryptocompare.com${currency.ImageUrl}" width="30" /> ${currency.CoinName}</h2>
    </p>
    <p>
        ${price.EUR}€<br />
        ${intlFormatter.format(price.USD)}
    </p>
    <p>Total coins supply ${intlFormatter.format(currency.TotalCoinSupply)}</p>
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
      template.style.top = `${event.pageY}px`;
      template.style.left = `${event.pageX}px`;
    })
}

const hideTooltip = function(event, template) {
  template.style.visibility = "hidden";
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

      // Get crypto datas
      fetch('https://min-api.cryptocompare.com/data/all/coinlist')
        .then(response => response.json())
        .then(json => {
          CRYPTOS_DATA = json.Data;

          // Add event listener
          liveListener("mouseover", ".twitter-cashtag", (event) => displayTooltipOnCashtag(event, template))
          liveListener("mouseout", ".twitter-cashtag", (event) => hideTooltip(event, template))
        })
    }
  }, 10);
});

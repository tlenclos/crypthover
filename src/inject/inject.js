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

const addEventListenersOnCashtags = function(template) {
  const cashTagsElements = document.querySelectorAll('.twitter-cashtag');
  // TODO Add support for twitter-hashtag (ie #Bitcoin, #LTC)

  for (let i = 0; i < cashTagsElements.length; ++i) {
    const cashTagsElement = cashTagsElements[i];

    cashTagsElement.addEventListener('mouseover', (event) => displayTooltipOnCashtag(event, template))
    cashTagsElement.addEventListener('mouseout', (event) => hideTooltip(event, template))
  }
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

      // Get crypto datas
      fetch('https://min-api.cryptocompare.com/data/all/coinlist')
        .then(response => response.json())
        .then(json => {
          CRYPTOS_DATA = json.Data;

          // Inject HTML
          const template = document.createElement('div');
          template.className = "crypthover"
          document.body.appendChild(template);

          // Add event listener on hover
          addEventListenersOnCashtags(template);
        })
    }
  }, 10);
});


export interface Env {
	CURRENCIES: KVNamespace;
	APP_ID: string;
};

export default {
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {

		const fetchProcessCurrencies = async () => {
			const currencies: currencyRateList = await fetch('https://openexchangerates.org/api/latest.json?app_id=' + env.APP_ID).then(res => res.json());
			await env.CURRENCIES.put('rates', JSON.stringify(currencies));
			const timestamp = currencies.timestamp;
			const rates = currencies.rates;
			const updatedList = [];
			for (const [currency, rate] of Object.entries(rates)) {
				let current = await env.CURRENCIES.get(currency);
				if (current) {
					let currentJSON = await JSON.parse(current)
					let updated = {
						...currentJSON,
						rateUSD: rate,
						updatedAt: timestamp
					};
					env.CURRENCIES.put(currency, JSON.stringify(updated))
					let updatedListItem = {
						key: currency,
						value: {
							...updated,
							flag: "https://images.identify.run/flags/" + updated.countryCode.toLowerCase() + ".svg"
						}
					};
					updatedList.push(updatedListItem);
				}
			}
			env.CURRENCIES.put('currencies', JSON.stringify(updatedList));
		}
		// Runs every hour.
		ctx.waitUntil(fetchProcessCurrencies());
	},
  };

type currencyRateList = {
	disclaimer: string;
	license: string;
	timestamp: number;
	base: string;
	rates: object;
};


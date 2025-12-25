// Абстрактный адаптер провайдера
// Реальные реализации должны реализовать функции:
// - allocateNumber({country, service, ttlMinutes}) => { provider_rental_id, phone_number, provider_id }
// - cancelNumber(provider_rental_id) => { success }
// - pollMessages(provider_rental_id) => [{ from, text, received_at }]
//
// В этом репозитории по умолчанию подключён mockProvider.
// Меняйте подключение в rentalService.js при необходимости.
module.exports = {
	allocateNumber: async opts => {
		throw new Error('Not implemented')
	},
	cancelNumber: async providerRentalId => {
		throw new Error('Not implemented')
	},
	pollMessages: async providerRentalId => {
		throw new Error('Not implemented')
	},
}

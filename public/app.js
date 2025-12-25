// Простой frontend: регистрация/логин, получение номера, polling SMS
const API = '/api'
let token = localStorage.getItem('token') || null
let currentRental = null
let pollInterval = null

function authHeaders() {
	return token ? { Authorization: 'Bearer ' + token } : {}
}

async function request(path, opts = {}) {
	opts.headers = Object.assign(
		opts.headers || {},
		{ 'Content-Type': 'application/json' },
		authHeaders()
	)
	const res = await fetch(path, opts)
	if (res.status === 401) {
		logout()
		throw new Error('Unauthorized')
	}
	return res.json()
}

function show(elem) {
	elem.style.display = ''
}
function hide(elem) {
	elem.style.display = 'none'
}

async function updateMe() {
	try {
		const data = await request(API + '/me')
		document.getElementById('me-email').textContent = data.email
		document.getElementById('me-balance').textContent = data.balance.toFixed(2)
		show(document.getElementById('user-info'))
		hide(document.getElementById('auth-forms'))
		show(document.getElementById('rent-section'))
	} catch (err) {
		console.log('Not logged in')
		hide(document.getElementById('user-info'))
		show(document.getElementById('auth-forms'))
		hide(document.getElementById('rent-section'))
	}
}

document.getElementById('btn-register').onclick = async () => {
	const email = document.getElementById('email').value
	const password = document.getElementById('password').value
	try {
		const res = await request(API + '/register', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		})
		if (res.token) {
			token = res.token
			localStorage.setItem('token', token)
			await updateMe()
		} else alert(res.error || 'Error')
	} catch (err) {
		alert(err.message)
	}
}

document.getElementById('btn-login').onclick = async () => {
	const email = document.getElementById('email').value
	const password = document.getElementById('password').value
	try {
		const res = await request(API + '/login', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		})
		if (res.token) {
			token = res.token
			localStorage.setItem('token', token)
			await updateMe()
		} else alert(res.error || 'Error')
	} catch (err) {
		alert(err.message)
	}
}

document.getElementById('btn-logout').onclick = () => {
	logout()
}

function logout() {
	token = null
	localStorage.removeItem('token')
	hide(document.getElementById('user-info'))
	show(document.getElementById('auth-forms'))
	hide(document.getElementById('rent-section'))
	stopPolling()
}

document.getElementById('btn-get-number').onclick = async () => {
	const minutes = parseInt(document.getElementById('rent-minutes').value, 10)
	try {
		const res = await request(API + '/rent', {
			method: 'POST',
			body: JSON.stringify({ minutes }),
		})
		if (res.id) {
			currentRental = res
			showRental(res)
			startPollingSms(res.id)
		} else {
			alert(res.error || 'Error')
		}
	} catch (err) {
		alert(err.message || 'Error')
	}
}

async function showRental(rental) {
	document.getElementById('rental-number').textContent =
		rental.phone_number || rental.phone_number || rental.phone
	document.getElementById('rental-price').textContent = (
		rental.price || 0
	).toFixed(2)
	document.getElementById('rental-end').textContent = rental.end_at || ''
	document.getElementById('rental-status').textContent = 'WAIT_SMS'
	show(document.getElementById('rental-area'))
	updateTimer()
}

function updateTimer() {
	if (!currentRental || !currentRental.end_at) return
	const end = new Date(currentRental.end_at)
	function tick() {
		const diff = end - new Date()
		if (diff <= 0) {
			document.getElementById('rental-timer').textContent = '00:00'
			// fetch status
			fetchRentalStatus()
			stopPolling()
			return
		}
		const m = Math.floor(diff / 60000)
		const s = Math.floor((diff % 60000) / 1000)
		document.getElementById('rental-timer').textContent = `${String(m).padStart(
			2,
			'0'
		)}:${String(s).padStart(2, '0')}`
	}
	tick()
	setInterval(tick, 1000)
}

document.getElementById('btn-cancel-rental').onclick = async () => {
	if (!currentRental) return
	try {
		const res = await request(API + `/rent/${currentRental.id}/cancel`, {
			method: 'POST',
		})
		if (res.ok) {
			alert('Cancelled')
			stopPolling()
			document.getElementById('rental-status').textContent = 'CANCELLED'
		} else alert(res.error || 'Error')
	} catch (err) {
		alert(err.message)
	}
}

async function fetchRentalStatus() {
	if (!currentRental) return
	try {
		const res = await request(API + `/rent/${currentRental.id}`)
		document.getElementById('rental-status').textContent = res.status
		const smsRes = await request(API + `/rent/${currentRental.id}/sms`)
		renderSms(smsRes.sms || [])
	} catch (err) {
		console.error(err)
	}
}

function renderSms(list) {
	const el = document.getElementById('sms-list')
	el.innerHTML = ''
	for (const s of list) {
		const div = document.createElement('div')
		div.className = 'sms-item'
		div.innerHTML = `<div><strong>${s.from_number || s.from}</strong> <small>${
			s.received_at
		}</small></div><div>${s.text}</div>`
		el.appendChild(div)
	}
}

function startPollingSms(rentalId) {
	stopPolling()
	pollInterval = setInterval(async () => {
		try {
			const res = await request(API + `/rent/${rentalId}/sms`)
			document.getElementById('rental-status').textContent = res.status
			renderSms(res.sms || [])
			if (['RECEIVED', 'TIMEOUT', 'CANCELLED'].includes(res.status)) {
				stopPolling()
			}
		} catch (err) {
			console.error('Polling error', err)
		}
	}, 3000)
}

function stopPolling() {
	if (pollInterval) clearInterval(pollInterval)
	pollInterval = null
}

// Demo webhook sender
document.getElementById('btn-send-webhook').onclick = async () => {
	const provider_rental_id = document.getElementById(
		'demo-provider-rental-id'
	).value
	const from = document.getElementById('demo-from').value || '+12025550000'
	const text = document.getElementById('demo-text').value || 'Test code 1234'
	try {
		const res = await fetch('/provider/webhook', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ provider_rental_id, from, text }),
		})
		const data = await res.json()
		alert(JSON.stringify(data))
	} catch (err) {
		alert('Error')
	}
}

window.onload = () => {
	if (token) updateMe()
}

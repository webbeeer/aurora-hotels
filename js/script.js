let map;
let allRooms = [];
let currentWeather = "";

// hotel icon
const hotelIcon = L.icon({
    iconUrl: 'img/pin.svg',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -44],
});

// user icon
const userIcon = L.icon({
    iconUrl: 'img/userPin.svg',
    iconSize: [36, 36],
    iconAnchor: [12, 12],
    popupAnchor: [0, -44],
})

// initialize map when dom is ready
document.addEventListener('DOMContentLoaded', () => {
    map = L.map('map').setView([20, 0], 2); // center map at coordinates 20 0 with zoom 2

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 400); // fix map size after render

    loadHotels(); // load hotels from JSON
});

// fetch hotels from JSON file and display them
let loadHotels = async () => {
    let hotelFetch = await fetch('/public/hotels.json'); // fetch the hotels JSON file
    let hotels = await hotelFetch.json(); // parse JSON response

    $(".hotelGrid").html(displayHotels(hotels)); // render hotel cards in the grid

    // loop through each hotel to add map markers
    for (let i = 0; i < hotels.length; i++) {

        const weatherData = await getWeather(hotels[i].lat, hotels[i].lng); // get weather for hotel location

        // format weather string or show N/A if unavailable
        let weatherHtml;

        if (weatherData) {
            weatherHtml = `${weatherData.temp}°C · ${weatherData.condition}`;
        } else {
            weatherHtml = 'N/A';
        }   

        // add marker to map with popup containing hotel info
        L.marker([hotels[i].lat, hotels[i].lng], { icon: hotelIcon }).addTo(map).
        bindPopup(`
        <div class="customPopUp"">
            <h5><b>${hotels[i].name}</b></h5>
            <p style="margin: 0; color: #666; font-size: 13px;"><i class="bi bi-geo-fill"></i> ${hotels[i].city}, ${hotels[i].country}</p>
            <p style="margin: 8px 0; font-size: 13px; font-weight: 500;">Pet Friendly? ${hotels[i].petFriendly}</p>
            <p style="font-size: 13px;"><i class="bi bi-cloud-sun-fill"></i> ${weatherHtml}</p>
            <button class="btn btn-dark btn-sm w-100" id="btnShowRoom" data-id="${hotels[i].id}" data-weather="${weatherData ? weatherData.condition : ''}" style="margin-top: 5px;">Show Rooms</button>
        </div>
    `);
    }
}

// handle click on Show Rooms button inside map popup
$(document).on("click", "#btnShowRoom", function() {

    currentWeather = $(this).data("weather"); // store the current weather to apply the discount

    let hotelId = $(this).data("id"); // get hotel id from button data attribute
    let filteredRooms = allRooms.filter(r => r.hotelId == hotelId); // filter rooms by hotel id
    // r is the "selected" room

    let roomsHtml = ""; // string to build room cards

    // loop through filtered rooms and build the cards
    filteredRooms.forEach(room => {
            roomsHtml += `
            <div class="col-md-4">
                <div class="card room-modal-card h-100 shadow-sm">
                    <div class="roomImageContainer">
                        <img src="${room.image}">
                    </div>
                    <div class="card-body">
                        <h6 class="fw-bold mb-1">${room.name}</h6>
                        <div class="room-features mb-3">
                            <span><i class="bi bi-people"></i> ${room.maxGuests} Guests</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="price-tag">$${room.pricePerNight}<small class="text-muted" style="font-size: 10px">/night</small></span>
                            <button 
                                class="btn btn-dark btn-sm px-3" 
                                style="border-radius:.875rem"
                                data-room='${JSON.stringify(room)}'
                                data-hotel-id="${hotelId}"
                                onclick="handleAddToCart(this)">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        });

    $('#roomsContainer').html(roomsHtml); // inject rooms into modal

    var roomsModal = new bootstrap.Modal(document.getElementById('roomsModal')); // create modal instance
    roomsModal.show(); // show the modal
});

// fetch rooms from JSON file
let loadRooms = async () => {
  let roomFetch = await fetch('/public/rooms.json'); // fetch rooms JSON
  allRooms = await roomFetch.json(); // store parsed rooms on the whole code
}

// build hotel cards from hotels array
let displayHotels = (hotels) => {
    let html = `<div class="row">`; // open bootstrap row

    // loop through hotels and create a card for each one
    for (let i = 0; i < hotels.length; i++) {
        html += `
        <div class="col-md-3 mb-4 hotelCard">
        <div class="card">
            <div class="card-img-wrapper">
            <img src="${hotels[i].image}" class="card-img-top">
            <div class="badge-rating"><i class="bi bi-star-fill"></i> ${hotels[i].rating}</div> <!-- star rating badge -->
            </div>
            <div class="card-body">
            <p class="card-location">${hotels[i].city} · ${hotels[i].country}</p>
            <h5 class="card-title">${hotels[i].name}</h5>
            <p class="card-description">${hotels[i].description}</p>
            <button class="btn btn-outline-dark btn-sm seeHotelBtn" 
                data-lat="${hotels[i].lat}" 
                data-lng="${hotels[i].lng}">
                See hotel
            </button>
            </div>
        </div>
        </div>
        `;
    }

    html += `</div>`; // close the row div to not create 1 row in each loop

    return html; // return the complete HTML string
}

loadRooms(); // load rooms when page load
loadHotels(); // load hotels qhen page load

// go to the hotel location on map when See Hotel button is clicked
$(document).on("click", ".seeHotelBtn", function() {
    const lat = parseFloat($(this).data("lat")); // get latitude from data attribute
    const lng = parseFloat($(this).data("lng")); // get longitude from data attribute

    // animate map to hotel coordinates
    map.flyTo([lat, lng], 14, {
        animate: true,
        duration: 1.5
    });

    document.getElementById('map').scrollIntoView({ behavior: 'smooth' }); // scroll to map section with smooth behavior
});

// get user current geolocation
const locationDisplay = document.getElementById("demo");

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error); // request position
  } else {
    locationDisplay.innerHTML = "Geolocation is not supported by this browser."; // browser doesn't support geolocation
  }
}

// called when geolocation succeeds
function success(position) {
    const userLat = position.coords.latitude; // user latitude
    const userLng = position.coords.longitude; // user longitude

    // go to user location in the map
    map.flyTo([userLat, userLng], 15, {
        animate: true,
        duration: 1.5 
    });

    L.marker([userLat, userLng], {icon: userIcon}).addTo(map); // add user marker to map

    console.log("works")
}

// called when geolocation fails
function error() {
  console.log("error: geoLocation failed");
}

// fetch current weather data for given coordinates
async function getWeather(lat, lon) {
    const apiKey = "f65a46cf11144400b96221734260604"; // weatherAPI key
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`; // API url

    try {
        const response = await fetch(url); // make API request
        const data = await response.json(); // parse response
        
        return {
            temp: data.current.temp_c, // temperature in celsius
            condition: data.current.condition.text, // weather condition 
        };
    } catch (error) {
        console.error("Error trying to find the weather:", error); // error
        return null; // return null if request fails
    }
}

// weather thing


// parse room data from button and call addToCart
function handleAddToCart(element) {
    const room = JSON.parse(element.dataset.room); // parse room object from data attribute
    const hotelId = element.dataset.hotelId; // get hotel id
    addToCart(room, hotelId); // add room to cart
}

// get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('cart'); // retrieve cart string
    return cart && JSON.parse(cart) || []; // parse and return or return empty array
}

// save cart to localStorage and update the UI
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart)); // save cart as JSON string
    renderCart(); // re-render cart UI
}

// add a room to the cart
function addToCart(room, hotelId) {
    const cart = getCart(); // get current cart

    let isRaining = currentWeather.toLowerCase().includes("rain");
    let finalPrice = room.pricePerNight;

    if (isRaining) {
        finalPrice = +(room.pricePerNight * 0.90).toFixed(2); // 10% 
    }

    finalPrice = +(finalPrice * 1.05).toFixed(2); // 5% service tax

        cart.push({
            roomId:         room.id,
            hotelId:        hotelId,
            name:           room.name,
            image:          room.image,
            pricePerNight:  finalPrice, // final price w discount
            hasDiscount:    isRaining,
            originalPrice: room.pricePerNight,
            maxGuests:      room.maxGuests,
            qty:            1,
            addedAt:        new Date().toISOString() // date the room was booked
        });

    saveCart(cart); // save updated cart
    showToast(`"${room.name}" added to cart!`); // show confirmation msg
}

// remove a specific room from the cart
function removeFromCart(roomId, hotelId) {
    let cart = getCart().filter(item => !(item.roomId == roomId && item.hotelId == hotelId)); // filter out the removed item
    saveCart(cart); // save updated cart
}

// render cart items in the sidebar
function renderCart() {
    const cart = getCart(); // get current cart
    const cartContainer = document.querySelector('.booked'); // get cart element
    let adults = parseInt($('#adultsQty').text()) || 1;
    let children = parseInt($('#childrenQty').text()) || 0;
    let totalGuests = adults + children; // infants dont count

    if (!cartContainer) return; // exit if container not found

    // show empty message 
    if (cart.length === 0) {
        cartContainer.innerHTML = `<p class="text-center text-muted mt-4">Your cart is empty.</p>`;
        return;
    }

    const checkIn = $('#searchCheckIn').val();
    const checkOut = $('#searchCheckOut').val();
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    let nights = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24); // just subtracting the date its a huge number, milliseconds * seconds * min * hour
    nights = nights || 1; // 1 night if 0 or invalid number

    const totalPerNight = cart.reduce((sum, item) => sum + item.pricePerNight * item.qty, 0);
    const totalGeral = totalPerNight * nights;

    // build HTML for each cart item and total at the bottom
    let html = cart.map(item => `
        <div class="d-flex gap-3 mb-3 p-2 border rounded-3">
            <img src="${item.image}" style="width:80px;height:60px;object-fit:cover;border-radius:8px">
            <div class="flex-grow-1">
                <h6 class="mb-0 fw-bold" style="font-size:14px">${item.name}</h6>
                <small class="text-muted">$${item.originalPrice} x ${item.qty} room(s) x ${nights} night(s)</small>
                <div class="fw-bold mt-1">$${(item.originalPrice * item.qty).toFixed(2)}</div>
            </div>
            <button class="btn btn-sm btn-outline-danger align-self-start" 
                onclick="removeFromCart(${item.roomId}, ${item.hotelId})">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');

   html += `
    <div class="border-top pt-3 mt-2">
        <div class="d-flex justify-content-between text-muted mb-1">
            <span>Stay duration:</span>
            <span>${nights} night(s)</span>
        </div>
        <div class="d-flex justify-content-between text-muted mb-1">
            <span>Guests:</span>
            <span>${totalGuests} guest(s)</span>
        </div>
        ${cart.some(item => item.hasDiscount) ? `
        <div class="d-flex justify-content-between mb-1">
            <span style="color: green"><i class="bi bi-cloud-drizzle-fill" style="color: #001226"></i> Rain discount:</span>
            <span style="color: green">-10%</span>
        </div>` : ''}
        <div class="d-flex justify-content-between mb-1">
            <span style="color: #888"><i class="bi bi-receipt" style="color: #001226"></i> Service tax:</span>
            <span style="color: #888">+5%</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <span class="fw-bold">Total to pay:</span>
            <strong style="font-size:20px" class="text-dark">$${totalGeral.toFixed(2)}</strong>
        </div>
    </div>
    `;

    cartContainer.innerHTML = html;
    $('#modalCheckIn').val(checkIn);
    $('#modalCheckOut').val(checkOut);
}

// show a temporary toast notification
function showToast(message) {
    let cartToast = document.getElementById('cartToast');
    if (!cartToast) {
        cartToast = document.createElement('div'); // create toast element
        cartToast.id = 'cartToast';
        document.body.appendChild(cartToast); // append to body
    }
    cartToast.textContent = message; // set toast message
    cartToast.style.opacity = '1'; // make toast visible
    clearTimeout(cartToast._timer); // clear any existing timer
    cartToast._timer = setTimeout(() => cartToast.style.opacity = '0', 3000); // hide after 3 seconds
}

// initialize cart and register offcanvas event on dom load
document.addEventListener('DOMContentLoaded', () => {
    renderCart(); // render cart on page load

    document.getElementById('offcanvasRight').addEventListener('show.bs.offcanvas', renderCart); // re-render cart when offcanvas opens
});

// handle quantity buttons in the search bar for guest selector
$(document).ready(function() {
    $('.qty-controls button').on('click', function() {
        const btn = $(this);
        const quantitySpan = btn.siblings('span'); // get the quantity display span
        let currentQty = parseInt(quantitySpan.text()); // parse current quantity as integer

        if (btn.text() === '+') {
            currentQty++; // plus quantity
        } else if (btn.text() === '-') {
            if (currentQty > 0) {
                currentQty--; // minus quantity if greater than 0
            }
        }
        quantitySpan.text(currentQty); // update displayed quantity
    });
});

// coordinates for each country that have a hotel
const countryCoords = {
    "Japan": [35.6895, 139.6917],
    "France": [48.8566, 2.3522],
    "Brazil": [-22.9672, -43.1789],
    "USA": [40.7128, -74.0060],
    "Singapore": [1.3521, 103.8198],
    "United Arab Emirates": [25.2048, 55.2708]
};

// fly to selected country when search button is clicked
$(document).ready(function() {
    $('#search').on('click', function() {
        const selectedCountry = $('.searchbar select').val(); // get selected country from dropdown

            const coords = countryCoords[selectedCountry]; // get coordinates for selected country

            // animate map to selected country
            map.flyTo(coords, 12, {
                animate: true,
                duration: 1.5
            });

            // scroll page to map section
            $('html, body').animate({
                scrollTop: $("#maps").offset().top - 100
            }, 800);
    });
});

// handle payment form validation and submission
$('#staticBackdrop .btn-primary').click(function() {
    let btn = $(this);
    let errors = []; // array to store validation errors

    // get all form input elements
    const inputEmail = $('#email');
    const inputCard = $('#cardNumber');
    const inputExpiry = $('#expiry');
    const inputCvv = $('#cvv');
    const inputPhone = $('#tel');

    // regex for validation
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPhone = /^\d{3}[- ]?\d{3}[- ]?\d{4}$/;
    const regexCard = /^(\d{4}\s?){4}$/;
    const regexExpiry = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    const regexCvv = /^[0-9]{3,4}$/;

    // map inputs to their validation rules and error messages
    const inputs = [
        { el: inputEmail, regex: regexEmail, error: "Invalid Email Format" },
        { el: inputCard, regex: regexCard, error: "Invalid Card (0000 0000 0000 0000)" },
        { el: inputExpiry, regex: regexExpiry, error: "Invalid Expiry (MM/YY)" },
        { el: inputCvv, regex: regexCvv, error: "Invalid CVV" },
        { el: inputPhone, regex: regexPhone, error: "Invalid Phone (123 456 7890)" }
    ];

    // validate each input field w a loop
    for(let item of inputs){
        if(item.el.length === 0) {
            continue; // skip if element not found
        }

        let val = item.el.val();

        if (item.el.is(inputCard)) {
            val = val.replace(/\s/g, ''); // remove spaces from card number before validating
        }

        if(item.regex.test(val)){
            item.el.css('border-color', '').removeClass('input-error'); // clear error styling
        } else {
            errors.push(item); // add to errors array
            item.el.val(""); // clear invalid input
            item.el.attr('placeholder', item.error); // show error message as placeholder
        }
    }

    // proceed if no validation errors
    if(errors.length === 0){
        btn.html('<span class="spinner-border spinner-border-sm"></span> Processing'); // show loading spinner
        btn.prop('disabled', true); // disable button during processing

        setTimeout(function() {
            // change button to success
            btn.removeClass('btn-primary').css({ 
                'background-color': '#28a745',
                'background-image': 'none',
                'border-color': '#28a745',
                'color': '#fff'
            });
            btn.html('<i class="bi bi-check-lg"></i> Payment Done!'); // show success message
            
            setTimeout(function() {
                $('#staticBackdrop').modal('hide'); // close payment modal
                
                setTimeout(() => {
                    // reset button to original state
                    btn.prop('disabled', false)
                       .addClass('btn-primary')
                       .removeAttr('style')
                       .html('Checkout');
                        
                        getCart().forEach(item => saveToHistory(item)); // save each cart item to history
                        localStorage.removeItem('cart')
                        renderCart(); // re-render empty cart
                }, 500);
            }, 3000);
        }, 2000);
    }
});

// empty cart button
$('#emptyCart').click(function(){
    localStorage.removeItem('cart') // remove
    renderCart();
});

// register event to render history when offcanvas opens
document.getElementById('offcanvasHistory').addEventListener('show.bs.offcanvas', renderHistory);

// save a booking to history in localStorage
function saveToHistory(room) {
    const bookingHistory = JSON.parse(localStorage.getItem('bookingHistory') || '[]'); // get existing history or empty array
    bookingHistory.unshift({ // add new booking at the beginning of the array
        name:          room.name,
        image:         room.image,
        pricePerNight: room.pricePerNight,
        qty:           room.qty,
        bookedAt: new Date().toLocaleDateString('en-US') // format date
    });
    localStorage.setItem('bookingHistory', JSON.stringify(bookingHistory)); // save updated history
}

// render booking history in the offcanvas
function renderHistory() {
    const bookingHistory = JSON.parse(localStorage.getItem('bookingHistory') || '[]'); // get history from localStorage
    const historyContainer = document.getElementById('historyContainer'); // get history container element

    // show empty message if no history
    if (bookingHistory.length === 0) {
        historyContainer.innerHTML = `<p class="text-center text-muted mt-4">No bookings yet.</p>`;
        return;
    }

    // build a card for each history item
    historyContainer.innerHTML = bookingHistory.map(item => `
        <div class="d-flex gap-3 mb-3 p-2 border rounded-3">
            <img src="${item.image}" style="width:80px;height:60px;object-fit:cover;border-radius:8px">
            <div class="flex-grow-1">
                <h6 class="mb-0 fw-bold" style="font-size:14px">${item.name}</h6>
                <small class="text-muted"><i class="bi bi-calendar"></i> ${item.bookedAt}</small><br>
                <small class="text-muted">$${item.pricePerNight}/night × ${item.qty}</small>
                <div class="fw-bold mt-1">$${(item.pricePerNight * item.qty).toFixed(2)}</div>
            </div>
        </div>
    `).join(''); // join all items into single HTML string
}

$(document).on("change", "#searchCheckIn, #searchCheckOut", function() {
    renderCart();
});

$(document).on("change", "#modalCheckIn, #modalCheckOut", function() {
    $("#searchCheckIn").val($("#modalCheckIn").val());
    $("#searchCheckOut").val($("#modalCheckOut").val());
    renderCart();
});
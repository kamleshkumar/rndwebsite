import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import BookingWidget from './BookingWidget';


// --- Mock Data Setup ---
// We use this initial data structure before connecting to the backend (Supabase).
// The client can see what standard, deluxe, and suite rooms look like immediately.
const MOCK_ROOMS = [
  {
    id: 'standard',
    name: 'Standard Room',
    base_price: 1499,
    description: 'Perfect for quick stays and solo travelers. Features modern amenities and a comfortable bed.',
    images: [
      '/Standard 103/103A.png', '/Standard 103/103B.png', '/Standard 103/103C.png', '/Standard 103/103D.png',
      '/Standard 106/106A.png', '/Standard 106/106B.png', '/Standard 106/106C.png', '/Standard 106/106D.png', '/Standard 106/106E.png',
      '/Standard 203/203A.png', '/Standard 203/203B.png', '/Standard 203/203C.png', '/Standard 203/203D.png', '/Standard 203/203E.png'
    ]
  },
  {
    id: 'deluxe',
    name: 'Deluxe Room',
    base_price: 1939,
    description: 'A cozy, elegant space perfect for solo travelers and couples. Features plush bedding and enhanced views.',
    images: [
      '/Deluxe 101/101A.png', '/Deluxe 101/101B.png', '/Deluxe 101/101C.png', '/Deluxe 101/101D.png',
      '/Deluxe 102/102A.png', '/Deluxe 102/102B.png', '/Deluxe 102/102C.png', '/Deluxe 102/102D.png', '/Deluxe 102/102E.png', '/Deluxe 102/102F.png',
      '/Deluxe 105/105A.png', '/Deluxe 105/105B.png', '/Deluxe 105/105C.png', '/Deluxe 105/105D.png',
      '/Deluxe 201/201A.png', '/Deluxe 201/201B.png', '/Deluxe 201/201C.png', '/Deluxe 201/201D.png', '/Deluxe 201/201E.png',
      '/Deluxe 202/202A.png', '/Deluxe 202/202B.png', '/Deluxe 202/202C.png', '/Deluxe 202/202D.png'
    ]
  },
  {
    id: 'suite',
    name: 'Royal Suite',
    base_price: 3499,
    description: 'The ultimate luxury experience with premium regal interiors, expansive bathroom, and exclusive services.',
    images: [
      '/Suite 204/204A.png', '/Suite 204/204B.png', '/Suite 204/204C.png', '/Suite 204/204D.png', '/Suite 204/204E.png', '/Suite 204/204F.png', '/Suite 204/204G.png'
    ]
  }
]

export default function App() {
  // --- Core Application State ---
  // Theme Preferences: We store the user's design settings (color, radius, dark/light mode) 
  // in localStorage so they persist across page reloads.
  const [themePrefs, setThemePrefs] = useState(() => {
    const saved = localStorage.getItem('rajbari_theme_v2')
    return saved ? JSON.parse(saved) : { theme: 'dark', color: 'dark-gold', radius: 'balanced', button: 'solid' }
  })
  
  

  
  // Room Data State: Stores the list of rooms available for booking
  const [rooms, setRooms] = useState(MOCK_ROOMS)
  // Gallery Logic: Tracks which room's image gallery is currently open in the popup modal
  const [selectedGallery, setSelectedGallery] = useState(null) 
  
  // Legal Modal Logic: Tracks which legal document is open ('terms' or 'privacy')
  const [legalModal, setLegalModal] = useState(null)
  
  // Cart State: A simple object mapping roomId -> quantity (e.g., { 'standard': 1, 'suite': 2 })
  // This powers the dynamic checkout sidebar.
  const [cart, setCart] = useState({}) 
  
  // Form State
  const [formData, setFormData] = useState({ name: '', phone: '', checkIn: '', checkOut: '', guests: 1 })

  // --- Lifecycle Hooks ---
  // 1. Theme Syncer: Whenever 'themePrefs' changes, this applies the new CSS variables 
  // to the root HTML element, instantly changing the site's look and feel.
  useEffect(() => {
    // Apply preferences to HTML standard elements
    const html = document.documentElement;
    html.setAttribute('data-theme', themePrefs.theme);
    html.setAttribute('data-color', themePrefs.color);
    html.setAttribute('data-radius', themePrefs.radius);
    html.setAttribute('data-button', themePrefs.button);
    localStorage.setItem('rajbari_theme_v2', JSON.stringify(themePrefs))
  }, [themePrefs])

  // 2. Scroll Animation Observer: Triggers the smooth fade-in animations 
  // when an element with the 'reveal' class enters the screen viewport.
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) {
          entry.target.classList.add('visible') // Adds CSS class to trigger the CSS transition
          observer.unobserve(entry.target) // Only animate once
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, []) // Empty dep array assumes elements are rendered

  // 3. Backend Data Fetcher (Supabase)
  // On initial load, this attempts to grab real room data from the database.
  // If Supabase is not configured, the app gracefully falls back to MOCK_ROOMS.
  useEffect(() => {
    if (!supabase) return // No credentials configured — use mock data
    const fetchRooms = async () => {
      const { data, error } = await supabase.from('room_categories').select('*')
      if (data && data.length) { 
        // Supabase gives us arrays, let's just dump them directly into the state
        setRooms(data) 
      }
    }
    fetchRooms()
  }, [])

  // --- Core Application Logic ---
  
  // Updates specific theme preferences seamlessly
  const updatePref = (key, value) => {
    setThemePrefs(prev => ({ ...prev, [key]: value }))
  }

  // Cart Handlers: Easily add/remove rooms. If count drops below 1, it's removed entirely.
  const addToCart = (roomId) => {
    setCart(prev => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }))
  }
  
  const removeFromCart = (roomId) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[roomId] > 1) { newCart[roomId] -= 1 } 
      else { delete newCart[roomId] }
      return newCart
    })
  }

  // Calculates the final total cost dynamically based on the current cart contents
  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [roomId, qty]) => {
      const room = rooms.find(r => r.id === roomId)
      return total + (room ? room.base_price * qty : 0)
    }, 0)
  }

  // --- Checkout Workflow ---
  // Triggers when the user clicks 'Proceed to Payment'
  const handleCheckout = async (e) => {
    e.preventDefault()
    if (Object.keys(cart).length === 0) {
      alert("Please add at least one room to your booking cart.")
      return
    }

    // This is the payload structure that will be sent to the API/Payment Gateway
    const bookingPayload = {
      ...formData,
      totalAmount: calculateTotal(),
      items: cart
    }
    
    // Developer Note: Placeholder for API/Supabase insert and Channel Manager setup
    /* 
    const { data, error } = await supabase.from('bookings').insert([{
      guest_name: formData.name, phone: formData.phone, check_in: formData.checkIn,
      total_amount: bookingPayload.totalAmount, items: cart
    }])
    */

    alert(`Redirecting to Payment Gateway...\nTotal Amount: ₹${calculateTotal()}\nTech team will hook OTA Channel Syncing here!`)
    setCart({}) // Clear cart on successful handoff
  }

  return (
    <>
      {/* Navigation */}
      <nav>
        <div className="logo">Rajbari <span>Palace</span></div>
        <div style={{display: 'flex', alignItems: 'center', gap: '2rem'}}>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#rooms">Rooms</a>
            <a href="#amenities">Amenities</a>
            <a href="#reviews">Reviews</a>
            <a href="#contact">Contact</a>
          </div>
          <button 
            className="theme-toggle-btn"
            onClick={() => updatePref('theme', themePrefs.theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle Theme"
          >
            {themePrefs.theme === 'dark' ? <i className="ph-fill ph-moon"></i> : <i className="ph-fill ph-sun"></i>}
          </button>
        </div>
        <div className="menu-btn"><i className="ph ph-list"></i></div>
      </nav>

      {/* Hero */}
      <header className="hero">
        <div className="hero-bg"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-ring-container reveal">
            <div className="ornamental-ring"></div>
            <i className="ph-fill ph-crown hero-crown"></i>
          </div>
          <div className="rating reveal delay-100">
            <i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i>
            <span className="text">4.9/5 Guest Rating</span>
          </div>
          <h1 className="reveal delay-100">A Palace for Your Soul</h1>
          <p className="reveal delay-200">Experience royal heritage and deep serenity 4 km from the sacred Baba Baidyanath Dham.</p>
          {/* <div className="reveal delay-200" style={{display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <a href="#contact" className="btn btn-primary">Book Your Stay</a>
            <a href="#rooms" className="btn btn-primary" data-button="outline">Explore Rooms</a>
          </div> */}
        </div>
      </header>
      <BookingWidget />
      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span className="ticker-item"><i className="ph ph-bed"></i> Rooms from ₹1,499/night</span>
          <span className="ticker-item"><i className="ph-fill ph-star"></i> 4.9/5 on Google</span>
          <span className="ticker-item"><i className="ph ph-phone"></i> +91 9296969954</span>
          <span className="ticker-item"><i className="ph ph-map-pin"></i> 4 km from Baba Baidyanath Dham</span>
          <span className="ticker-item"><i className="ph ph-wifi-high"></i> Free High-Speed WiFi</span>
          
          <span className="ticker-item"><i className="ph ph-bed"></i> Rooms from ₹1,499/night</span>
          <span className="ticker-item"><i className="ph-fill ph-star"></i> 4.9/5 on Google</span>
          <span className="ticker-item"><i className="ph ph-phone"></i> +91 9296969954</span>
          <span className="ticker-item"><i className="ph ph-map-pin"></i> 4 km from Baba Baidyanath Dham</span>
          <span className="ticker-item"><i className="ph ph-wifi-high"></i> Free High-Speed WiFi</span>
        </div>
      </div>

      {/* About */}
      <section id="about" className="section container">
        <div className="grid-2">
          <div className="reveal">
            <div style={{position: 'relative', borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--border-color)'}}>
              <img src="/Indoor/IN01.JPG" alt="Rajbari Palace Interiors" />
              <div style={{position: 'absolute', bottom: '0', left: '0', right: '0', padding: '2rem', background: 'linear-gradient(0deg, rgba(0,0,0,0.8), transparent)'}}>
                <p style={{color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontStyle: 'italic'}}>"A perfect blend of devotion and luxury."</p>
              </div>
            </div>
          </div>
          <div className="reveal delay-100">
            <span className="subtitle">Our Philosophy</span>
            <h2 className="heading-xl">Heritage meets<br/>Serenity</h2>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.8'}}>
              Rajbari Palace rejects generic hotel templates. We build an experience that is royal but accessible, heritage-driven, warm, and deeply inviting. 
            </p>
            <p style={{color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.8'}}>
              Located in the sacred city of Deoghar, we cater to Hindu pilgrims visiting the temple, families on religious trips, and luxury travelers seeking a premium sanctuary. 
            </p>
            <div className="stats-block">
              <div className="stat-item">
                <h3>4km</h3>
                <p>To Baba Dham</p>
              </div>
              <div className="stat-item">
                <h3>26</h3>
                <p>5-Star Reviews</p>
              </div>
              <div className="stat-item">
                <h3>₹1.4k</h3>
                <p>Starting Price</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Booking Engine */}
      <section id="booking" className="section container" style={{background: 'var(--bg-secondary)', borderRadius: 'var(--radius-card)', padding: '8rem 5%', marginBlock: '4rem'}}>
        <div className="text-center reveal" style={{marginBottom: '5rem'}}>
          <span className="subtitle">Accommodations</span>
          <h2 className="heading-xl">Select Your Rooms</h2>
          <p style={{color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto'}}>Browse our curated categories, add them to your cart, and check out securely.</p>
        </div>
        
        <div className="booking-layout">
          {/* Left Column: Room Grid */}
          <div className="grid-2" style={{gap: '2.5rem'}}>
            {rooms.map((room, idx) => (
              <div className={`card reveal delay-${idx*100}`} key={room.id}>
                <div className="card-img-wrap" onClick={() => setSelectedGallery(room)}>
                  <img src={room.images[0]} className="card-img" alt={room.name} onError={(e) => { e.target.src = "/Outdoor/OU01.png" }} />
                  <div style={{position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: 20, color:'#fff', fontSize: '0.8rem'}}>
                    <i className="ph ph-images"></i> View Gallery
                  </div>
                </div>
                <div className="card-content" style={{padding: '1.5rem'}}>
                  <h3 style={{color: 'var(--accent-color)', fontSize: '1.4rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)'}}>
                    ₹{room.base_price} <span style={{fontSize: '1rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 300}}>/ night</span>
                  </h3>
                  <h4 style={{fontSize: '1.6rem', marginBottom: '1rem'}}>{room.name}</h4>
                  <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', minHeight: '60px', fontSize: '0.9rem'}}>{room.description}</p>
                  
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <button onClick={() => addToCart(room.id)} className="btn btn-primary" style={{flex: 1, padding: '0.6rem 0.5rem', fontSize: '0.8rem'}}>Add Room</button>
                    {cart[room.id] && (
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-primary)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-main)', border: '1px solid var(--border-color)'}}>
                        <i className="ph ph-minus" onClick={() => removeFromCart(room.id)} style={{cursor: 'pointer'}}></i>
                        <span style={{fontWeight: 'bold', fontSize:'1rem'}}>{cart[room.id]}</span>
                        <i className="ph ph-plus" onClick={() => addToCart(room.id)} style={{cursor: 'pointer'}}></i>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Sticky Checkout Sidebar */}
          <div className="sticky-sidebar reveal delay-200">
            <div style={{background: 'var(--bg-primary)', padding: '2.5rem', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-color)', boxShadow: '0 15px 40px rgba(0,0,0,0.1)'}}>
              <span className="subtitle">Checkout</span>
              <h2 className="heading-lg" style={{fontSize: '2rem'}}>Finalize Booking</h2>
              
              {Object.keys(cart).length > 0 ? (
                <div className="booking-summary" style={{background: 'var(--bg-secondary)', padding: '1.5rem', marginBottom: '2rem'}}>
                  <h4 style={{marginBottom: '1rem', fontFamily: 'var(--font-heading)', fontSize: '1.2rem'}}>Selected Rooms:</h4>
                  {Object.entries(cart).map(([id, qty]) => {
                    const room = rooms.find(r => r.id === id)
                    return (
                      <div className="summary-item" key={id} style={{fontSize: '0.9rem', marginBottom: '0.5rem', paddingBottom: '0.5rem'}}>
                        <span>{qty}x {room.name}</span>
                        <span style={{color: 'var(--accent-color)', fontWeight: 'bold'}}>₹{room.base_price * qty}</span>
                      </div>
                    )
                  })}
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '1.1rem', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '1rem'}}>
                    <span>Total:</span>
                    <span style={{color: 'var(--accent-color)', fontSize: '1.3rem'}}>₹{calculateTotal()}</span>
                  </div>
                </div>
              ) : (
                <div style={{padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-main)', marginBottom: '2rem'}}>
                  <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Your cart is empty. Please select rooms on the left.</p>
                </div>
              )}

              <form onSubmit={handleCheckout}>
                <input type="text" placeholder="Full Name" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} style={{marginBottom: '1rem', padding: '1rem'}}/>
                <input type="tel" placeholder="Phone Number" required value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} style={{marginBottom: '1rem', padding: '1rem'}}/>
                <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                  <div style={{flex: 1}}>
                    <label style={{fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem', display: 'block'}}>Check-in</label>
                    <input type="date" required style={{color: 'var(--text-secondary)', padding: '1rem', marginBottom: 0}} value={formData.checkIn} onChange={e=>setFormData({...formData, checkIn: e.target.value})}/>
                  </div>
                  <div style={{flex: 1}}>
                    <label style={{fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem', display: 'block'}}>Check-out</label>
                    <input type="date" required style={{color: 'var(--text-secondary)', padding: '1rem', marginBottom: 0}} value={formData.checkOut} min={formData.checkIn || undefined} onChange={e=>setFormData({...formData, checkOut: e.target.value})}/>
                  </div>
                </div>
                <input type="number" placeholder="Total Guests" min="1" required value={formData.guests} onChange={e=>setFormData({...formData, guests: e.target.value})} style={{marginBottom: '1rem', padding: '1rem'}}/>
                
                <button type="submit" disabled={Object.keys(cart).length === 0} className="btn btn-primary" style={{width: '100%', borderRadius: 'var(--radius-main)', padding: '1rem', opacity: Object.keys(cart).length === 0 ? 0.5 : 1}}>Proceed to Payment</button>
                <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem', lineHeight: '1.4', opacity: Object.keys(cart).length === 0 ? 0.5 : 1}}>
                  By proceeding, you agree to our <a href="#terms" onClick={(e) => { e.preventDefault(); setLegalModal('terms'); }} style={{color: 'var(--accent-color)', textDecoration: 'none', borderBottom: '1px solid var(--accent-color)', transition: 'opacity 0.2s'}} onMouseOver={e => e.target.style.opacity = '0.8'} onMouseOut={e => e.target.style.opacity = '1'}>Terms & Conditions</a> and <a href="#privacy" onClick={(e) => { e.preventDefault(); setLegalModal('privacy'); }} style={{color: 'var(--accent-color)', textDecoration: 'none', borderBottom: '1px solid var(--accent-color)', transition: 'opacity 0.2s'}} onMouseOver={e => e.target.style.opacity = '0.8'} onMouseOut={e => e.target.style.opacity = '1'}>Privacy Policy</a>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="section container">
        <div className="text-center reveal" style={{marginBottom: '5rem'}}>
          <span className="subtitle">Experience</span>
          <h2 className="heading-xl">Premium Amenities</h2>
        </div>
        <div className="amenity-grid reveal">
          <div className="amenity-item"><i className="ph-fill ph-fork-knife"></i><p>Restaurant</p></div>
          <div className="amenity-item"><i className="ph-fill ph-barbell"></i><p>Gym</p></div>
          <div className="amenity-item"><i className="ph-fill ph-bell-ringing"></i><p>Room Service</p></div>
          <div className="amenity-item"><i className="ph-fill ph-wind"></i><p>Air Conditioning</p></div>
          <div className="amenity-item"><i className="ph-fill ph-wifi-high"></i><p>Free WiFi</p></div>
          <div className="amenity-item"><i className="ph-fill ph-lightning"></i><p>Power Backup</p></div>
          <div className="amenity-item"><i className="ph-fill ph-thermometer-cold"></i><p>Refrigerator</p></div>
          <div className="amenity-item"><i className="ph-fill ph-clock"></i><p>24-Hour Desk</p></div>
          <div className="amenity-item"><i className="ph-fill ph-car"></i><p>Ample Parking</p></div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="section container">
        <div className="text-center reveal" style={{marginBottom: '5rem'}}>
          <span className="subtitle">Visual Tour</span>
          <h2 className="heading-xl">The Property</h2>
        </div>
        <div className="masonry-grid reveal delay-100">
          {/* Dynamically loading a few from indoor/outdoor mapped in img.txt */}
          <img src="/Outdoor/OU01.png" alt="Outdoor View" />
          <img src="/Indoor/IN01.JPG" alt="Indoor Decor" />
          <img src="/Outdoor/OU02.png" alt="Outdoor View" />
          <img src="/Indoor/IN02.png" alt="Indoor Decor" />
          <img src="/Outdoor/OU03.png" alt="Outdoor View" />
          <img src="/Indoor/IN03.JPG" alt="Indoor Decor" />
          <img src="/Outdoor/OU04.png" alt="Outdoor View" />
          <img src="/Indoor/IN04.jpg" alt="Indoor Decor" />
          <img src="/Outdoor/OU05.png" alt="Outdoor View" />
        </div>
      </section>

      {/* Reviews (Static setup) */}
      <section id="reviews" className="section container" style={{marginTop: '4rem'}}>
        <div className="text-center reveal" style={{marginBottom: '5rem'}}>
          <span className="subtitle">Testimonials</span>
          <h2 className="heading-xl">Words from Our Guests</h2>
          <div className="rating" style={{justifyContent: 'center', marginTop: '1rem'}}>
            <h3 style={{fontSize: '3rem', color: 'var(--accent-color)', fontFamily: 'var(--font-heading)', marginRight: '15px'}}>4.9</h3>
            <div>
              <i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i>
              <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', letterSpacing: '1px'}}>BASED ON 26 REVIEWS</p>
            </div>
          </div>
        </div>
        <div className="grid-3">
          <div className="review-card reveal">
            <i className="ph-fill ph-quotes"></i>
            <p>"An absolute palace! The rooms are so clean and luxurious, and it's extremely close to Baba Mandir."</p>
            <div className="reviewer">
              <h5>Rahul Sharma</h5>
              <span style={{color: 'var(--accent-color)', fontSize: '0.8rem'}}><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i></span>
            </div>
          </div>
          <div className="review-card reveal delay-100">
            <i className="ph-fill ph-quotes"></i>
            <p>"Best hotel in Deoghar hands down. The royal aesthetic is beautiful, the food is amazing."</p>
            <div className="reviewer">
              <h5>Priya Singh</h5>
              <span style={{color: 'var(--accent-color)', fontSize: '0.8rem'}}><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i></span>
            </div>
          </div>
          <div className="review-card reveal delay-200">
            <i className="ph-fill ph-quotes"></i>
            <p>"Stayed here with my family during our pilgrimage. Huge parking space, very safe, Highly recommended."</p>
            <div className="reviewer">
              <h5>Amit Kumar</h5>
              <span style={{color: 'var(--accent-color)', fontSize: '0.8rem'}}><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i><i className="ph-fill ph-star"></i></span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section container" style={{marginTop: '2rem', marginBottom: '6rem'}}>
        <div className="text-center reveal" style={{marginBottom: '5rem'}}>
          <span className="subtitle">Get in Touch</span>
          <h2 className="heading-xl">Location & Contact</h2>
        </div>
        
        <div className="grid-2">
          <div className="reveal">
            <ul className="contact-list">
              <li><i className="ph-fill ph-map-pin"></i><div><h4 style={{color: 'var(--text-primary)', marginBottom: '0.2rem', fontFamily: 'var(--font-body)', fontSize: '1.2rem'}}>Address</h4><p style={{fontSize: '1.1rem'}}>Belabagan, Deoghar, Jharkhand 814112</p></div></li>
              <li><i className="ph-fill ph-phone-call"></i><div><h4 style={{color: 'var(--text-primary)', marginBottom: '0.2rem', fontFamily: 'var(--font-body)', fontSize: '1.2rem'}}>Phone</h4><p style={{fontSize: '1.1rem'}}>+91 9296969954</p></div></li>
              <li><i className="ph-fill ph-envelope"></i><div><h4 style={{color: 'var(--text-primary)', marginBottom: '0.2rem', fontFamily: 'var(--font-body)', fontSize: '1.2rem'}}>Email</h4><p style={{fontSize: '1.1rem'}}>contact@rajbaripalace.com</p></div></li>
              <li><i className="ph-fill ph-clock"></i><div><h4 style={{color: 'var(--text-primary)', marginBottom: '0.2rem', fontFamily: 'var(--font-body)', fontSize: '1.2rem'}}>Front Desk</h4><p style={{fontSize: '1.1rem'}}>24 Hours Open</p></div></li>
            </ul>
          </div>

          <div className="reveal delay-100">
            <div style={{borderRadius: 'var(--radius-card)', overflow: 'hidden', height: '250px', border: '1px solid var(--border-color)'}}>
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3623.570222019777!2d86.7027581750239!3d24.498416462963162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f116174a81ba37%3A0xc3cf6b95c3459c!2sDeoghar%2C%20Jharkhand!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" width="100%" height="100%" style={{border:0, filter: 'grayscale(20%) contrast(1.2)'}} allowFullScreen="" loading="lazy"></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container" style={{maxWidth: 800}}>
          <h2 style={{fontSize: '2.5rem', marginBottom: '0.5rem', color: '#fff'}}>Rajbari <span style={{color: 'var(--accent-color)', fontStyle: 'italic'}}>Palace</span></h2>
          <p style={{color: 'var(--text-secondary)'}}>A Luxury Boutique Resort in the sacred heart of Deoghar.</p>
          <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'}}>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>&copy; 2026 Rajbari Palace. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Gallery Modal (Popup built dynamic for each room) */}
      <div className={`modal-overlay ${selectedGallery ? 'open' : ''}`} onClick={(e) => {if(e.target === e.currentTarget) setSelectedGallery(null)}}>
        <div className="modal-content">
          <button className="modal-close" onClick={() => setSelectedGallery(null)}><i className="ph ph-x" style={{fontSize: '2rem'}}></i></button>
          
          {selectedGallery && (
            <>
              <h2 className="heading-lg" style={{marginBottom: '0.5rem'}}>{selectedGallery.name} Gallery</h2>
              <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>{selectedGallery.description}</p>
              
              <div className="gallery-grid">
                {selectedGallery.images.map((imgUrl, i) => (
                  <img src={imgUrl} key={i} className="gallery-item" alt={`${selectedGallery.name} View ${i+1}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legal Modal */}
      <div className={`modal-overlay ${legalModal ? 'open' : ''}`} onClick={(e) => {if(e.target === e.currentTarget) setLegalModal(null)}}>
        <div className="modal-content" style={{maxWidth: '800px'}}>
          <button className="modal-close" onClick={() => setLegalModal(null)}><i className="ph ph-x" style={{fontSize: '2rem'}}></i></button>
          
          {legalModal === 'terms' && (
            <>
              <h2 className="heading-lg" style={{marginBottom: '1rem'}}>Terms & Conditions</h2>
              <div style={{color: 'var(--text-secondary)', lineHeight: '1.8', maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem'}}>
                <h4 style={{color: 'var(--text-primary)', marginTop: '1rem'}}>1. Booking and Reservation</h4>
                <p>All bookings are subject to availability and confirmation. A valid ID is required at the time of check-in.</p>
                <h4 style={{color: 'var(--text-primary)', marginTop: '1rem'}}>2. Cancellation Policy</h4>
                <p>Cancellations made 48 hours prior to the check-in date will receive a full refund. Late cancellations or no-shows will be charged the first night's rate.</p>
                <h4 style={{color: 'var(--text-primary)', marginTop: '1rem'}}>3. Check-In / Check-Out</h4>
                <p>Standard check-in time is 2:00 PM and check-out is 11:00 AM. Early check-in or late check-out is subject to availability and may incur additional charges.</p>
                <h4 style={{color: 'var(--text-primary)', marginTop: '1rem'}}>4. Hotel Policies</h4>
                <p>Guests are expected to maintain the decorum of the premises. Smoking is prohibited in all rooms. Any damage to hotel property will be charged to the guest.</p>
              </div>
            </>
          )}

          {legalModal === 'privacy' && (
            <>
              <h2 className="heading-lg" style={{marginBottom: '1rem'}}>Privacy Policy</h2>
              <div style={{color: 'var(--text-secondary)', lineHeight: '1.8', maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem'}}>
                <h4 style={{color: 'var(--text-primary)', marginTop: '1rem'}}>Data Collection</h4>
                <p>We collect personal information such as your name, contact number, and email address solely for the purpose of managing your reservation and improving our services.</p>
                <h4 style={{color: 'var(--text-primary)', marginTop: '1rem'}}>Data Security</h4>
                <p>Your data is securely stored and is never shared with third parties for marketing purposes without your explicit consent.</p>
              </div>
            </>
          )}
        </div>
      </div>

    </>
  )
}

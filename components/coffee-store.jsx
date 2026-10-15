'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const DEFAULT_OPTIONS = { weight: '500g', grind: 'طحنة ناعمة (تركية)' };

async function apiRequest(url, { adminPassword, ...init } = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
      ...init.headers,
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'حدث خطأ غير متوقع، حاول مرة أخرى.');
  return data;
}

const fetchProducts = (url) => apiRequest(url);
const fetchOrders = ([url, adminPassword]) => apiRequest(url, { adminPassword });

const formatOrderDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('ar-EG');
  } catch (e) {
    return '';
  }
};

export default function App() {
  const { data: products = [], error: productsError, isLoading: productsLoading, mutate: mutateProducts } =
    useSWR('/api/products', fetchProducts);

  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('shop');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // استرجاع السلة من ذاكرة المتصفح عند بداية التحميل
  useEffect(() => {
    const savedCart = localStorage.getItem('premium_coffee_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("خطأ في قراءة السلة", e);
      }
    }
  }, []);

  // حفظ السلة تلقائياً مع كل تعديل
  useEffect(() => {
    localStorage.setItem('premium_coffee_cart', JSON.stringify(cart));
  }, [cart]);

  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [footerClicks, setFooterClicks] = useState(0);

  const { data: orders = [], mutate: mutateOrders } = useSWR(
    isAuthenticated ? ['/api/orders', adminPassword] : null,
    fetchOrders
  );

  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  const [newProductForm, setNewProductForm] = useState({ name: '', subtitle: '', priceBase: '', category: 'محوج', image: '', stock: '10' });
  const [editingProduct, setEditingProduct] = useState(null);

  const [productOptions, setProductOptions] = useState({});

  const handleImageUpload = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، الحد الأقصى 2 ميجابايت.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditing) {
          setEditingProduct(prev => ({ ...prev, image: reader.result }));
        } else {
          setNewProductForm(prev => ({ ...prev, image: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const calculatePrice = (basePrice, weight) => {
    if (weight === '250g') return Math.round(basePrice * 0.55);
    if (weight === '500g') return basePrice;
    if (weight === '1000g') return Math.round(basePrice * 1.85);
    return basePrice;
  };

  const handleOptionChange = (productId, field, value) => {
    setProductOptions(prev => ({
      ...prev,
      [productId]: { ...DEFAULT_OPTIONS, ...prev[productId], [field]: value }
    }));
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('عذراً، هذا المنتج نفذ من المخزن حالياً.');
      return;
    }

    const opts = productOptions[product.id] || DEFAULT_OPTIONS;
    const finalPrice = calculatePrice(product.priceBase, opts.weight);
    const itemKey = `${product.id}-${opts.weight}-${opts.grind}`;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.cartKey === itemKey);
      if (existing) {
        return prevCart.map(item =>
          item.cartKey === itemKey ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, {
        cartKey: itemKey,
        id: product.id,
        name: product.name,
        image: product.image,
        weight: opts.weight,
        grind: opts.grind,
        price: finalPrice,
        qty: 1
      }];
    });
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = cartTotal > 1000 ? 0 : 40;
  const grandTotal = cartTotal + deliveryFee;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingOrder) return;
    if (!customerForm.name || !customerForm.phone || !customerForm.address) {
      alert('يرجى استكمال البيانات.');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError('');
    try {
      const created = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerForm,
          items: cart.map(i => ({ productId: i.id, weight: i.weight, grind: i.grind, qty: i.qty })),
        }),
      });
      setLastOrderId(created.id);
      setOrderSuccess(true);
      setCart([]);
      localStorage.removeItem('premium_coffee_cart'); // مسح الذاكرة بعد الشراء
      setCustomerForm({ name: '', phone: '', address: '' });
      mutateProducts();
      if (isAuthenticated) mutateOrders();
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        adminPassword,
        body: JSON.stringify({ status: newStatus }),
      });
      mutateOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.priceBase) return;

    try {
      await apiRequest('/api/products', {
        method: 'POST',
        adminPassword,
        body: JSON.stringify({
          name: newProductForm.name,
          subtitle: newProductForm.subtitle,
          priceBase: Number(newProductForm.priceBase),
          category: newProductForm.category,
          image: newProductForm.image,
          stock: Number(newProductForm.stock) || 0,
        }),
      });
      mutateProducts();
      setNewProductForm({ name: '', subtitle: '', priceBase: '', category: 'محوج', image: '', stock: '10' });
      alert('تمت إضافة المنتج بالصورة بنجاح!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من المتجر؟')) return;
    try {
      await apiRequest(`/api/products/${productId}`, { method: 'DELETE', adminPassword });
      mutateProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً من السجل؟')) return;
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE', adminPassword });
      mutateOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        adminPassword,
        body: JSON.stringify({
          name: editingProduct.name,
          priceBase: Number(editingProduct.priceBase),
          stock: Number(editingProduct.stock),
          image: editingProduct.image,
        }),
      });
      mutateProducts();
      setEditingProduct(null);
      alert('تم تحديث بيانات المنتج والمخزن بنجاح!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: enteredPassword }),
      });
      setAdminPassword(enteredPassword);
      setIsAuthenticated(true);
      setPasswordError('');
      setEnteredPassword('');
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword('');
    setActiveTab('shop');
  };

  const handleSecretAdminTrigger = () => {
    const nextCount = footerClicks + 1;
    setFooterClicks(nextCount);
    if (nextCount >= 3) {
      setActiveTab('admin');
      setFooterClicks(0);
    }
  };

  const filteredProducts = selectedCategory === 'الكل'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'جديد': return { backgroundColor: '#FFF3CD', color: '#856404', border: '1px solid #FFEEBA' };
      case 'جاري الشحن': return { backgroundColor: '#CCE5FF', color: '#004085', border: '1px solid #B8DAFF' };
      case 'تم التسليم': return { backgroundColor: '#D4EDDA', color: '#155724', border: '1px solid #C3E6CB' };
      case 'ملغي': return { backgroundColor: '#F8D7DA', color: '#721C24', border: '1px solid #F5C6CB' };
      default: return { backgroundColor: '#E2E3E5', color: '#383D41' };
    }
  };

  const countNewOrders = orders.filter(o => o?.status === 'جديد').length;
  const countShippingOrders = orders.filter(o => o?.status === 'جاري الشحن').length;
  const countDeliveredOrders = orders.filter(o => o?.status === 'تم التسليم').length;
  const countCancelledOrders = orders.filter(o => o?.status === 'ملغي').length;

  const totalSales = orders
    .filter(o => o?.status === 'تم التسليم')
    .reduce((sum, o) => sum + (Number(o?.total) || 0), 0);

  const scrollToContact = () => {
    const el = document.getElementById('contact-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={styles.topBanner}>شحن مجاني للطلبات الأكثر من 1000 ج.م داخل القاهرة والجيزة</div>
        <nav style={styles.navBar}>
          <div style={styles.brandLogo} onClick={() => { setActiveTab('shop'); setOrderSuccess(false); }}>
            <span style={{ fontSize: '1.6rem' }}>☕</span>
            <div>
              قهوة بريميوم 
              <span style={styles.logoSub}>PREMIUM COFFEE</span>
            </div>
          </div>

          <div style={styles.navLinks}>
            <button 
              style={{
                ...styles.navBtn,
                fontWeight: activeTab === 'shop' ? 'bold' : 'normal',
                borderBottom: activeTab === 'shop' ? '2px solid #3C2A21' : '2px solid transparent'
              }}
              onClick={() => { setActiveTab('shop'); setOrderSuccess(false); }}
            >
              الرئيسية
            </button>
            <button style={styles.navBtn} onClick={scrollToContact}>
              تواصل معنا
            </button>
          </div>

          <div style={styles.cartIconContainer} onClick={() => { setActiveTab('cart'); setOrderSuccess(false); }}>
            <span style={styles.cartIcon}>🛒</span>
            <span style={styles.cartBadge}>{cart.reduce((a, b) => a + b.qty, 0)}</span>
          </div>
        </nav>
      </header>

      {activeTab === 'shop' && (
        <main style={styles.mainContent}>
          <section style={styles.heroSection}>
            <div style={styles.heroTextContainer}>
              <h1 style={styles.heroTitle}>100% ORGANIC COFFEE,<br />CRAFTED FOR COFFEE LOVERS</h1>
              <p style={styles.heroSubtitle}>
                بن كولومبي فاخر ومحمص بعناية فائقة، لتقديم أرقى تجربة قهوة يومية بأعلى معايير الجودة والتميز.
              </p>
              <div style={styles.heroButtons}>
                <button style={{ ...styles.primaryBtn, active: 'scale(0.95)', transition: 'all 0.15s ease' }} onClick={() => {
                  const el = document.getElementById('products-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>SHOP NOW</button>
                <button style={{ ...styles.secondaryBtn, active: 'scale(0.95)', transition: 'all 0.15s ease' }} onClick={scrollToContact}>CONTACT US</button>
              </div>
            </div>

            <div style={styles.heroImageCard}>
              <img src= "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80" alt="تشكيلة أكياس قهوة بريميوم" style={styles.heroImg} />
            </div>
          </section>

          <section style={styles.sectionPadding}>
            <div style={styles.curationsGrid}>
              <div style={styles.curationTextCol}>
                <h2 style={styles.sectionTitleLarge}>SPECIALTY COFFEE<br />CURATIONS</h2>
                <a href="#products-grid" style={styles.discoverLink}>DISCOVER MORE →</a>
                <div style={styles.archImageWrapper}>
                  <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80" alt="فنجان قهوة" style={styles.archImg} />
                </div>
              </div>

              <div style={styles.curationFeaturedCol}>
                <img src="https://i.ibb.co/4w9MVBxY/Whats-App-Image-2026-10-06-at-2-31-08-PM.jpg" alt="كيس بن بريميوم" style={styles.featuredBagImg} />
                <div style={styles.featuredOverlayText}>
                  <h3>قهوة محوجة فاخرة</h3>
                  <p>تحميص وسط ومحوج ببهارات القهوة الأصلية</p>
                </div>
              </div>
            </div>
          </section>

          <section id="products-grid" style={{ ...styles.sectionPadding, backgroundColor: '#fcfaf7' }}>
            <div style={styles.sectionHeaderCenter}>
              <h2 style={styles.sectionTitle}>TOP PICKS</h2>
              <p style={styles.sectionSub}>اختر نوع البن والوزن وطريقة الطحن المفضلة لديك</p>

              <div style={styles.filterBar}>
                {['الكل', 'محوج', 'سادة', 'نكهات'].map(cat => (
                  <button
                    key={cat}
                    style={{
                      ...styles.filterBtn,
                      backgroundColor: selectedCategory === cat ? '#3C2A21' : '#FFFFFF',
                      color: selectedCategory === cat ? '#FFFFFF' : '#333333',
                      border: selectedCategory === cat ? '1px solid #3C2A21' : '1px solid #D8CEC4',
                      transform: 'scale(1)',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {productsLoading && (
              <p role="status" style={{ textAlign: 'center', color: '#8C6D58' }}>جاري تحميل المنتجات...</p>
            )}
            {productsError && (
              <p role="alert" style={{ textAlign: 'center', color: '#d9534f' }}>
                تعذر تحميل المنتجات.{' '}
                <button style={{ ...styles.secondaryBtn, padding: '4px 12px' }} onClick={() => mutateProducts()}>إعادة المحاولة</button>
              </p>
            )}
            {!productsLoading && !productsError && filteredProducts.length === 0 && (
              <p style={{ textAlign: 'center', color: '#777' }}>لا توجد منتجات في هذا التصنيف حالياً.</p>
            )}
            <div style={styles.productsGrid}>
              {filteredProducts.map(product => {
                const currentOpts = productOptions[product.id] || { weight: '500g', grind: 'طحنة ناعمة (تركية)' };
                const currentPrice = calculatePrice(product.priceBase, currentOpts.weight);
                const isOutOfStock = product.stock <= 0;

                return (
                  <div key={product.id} style={{ ...styles.productCard, opacity: isOutOfStock ? 0.75 : 1 }}>
                    <div style={styles.productImgContainer}>
                      <img src={product.image} alt={product.name} style={styles.productImg} />
                      <span style={styles.categoryBadge}>{product.category}</span>
                      {isOutOfStock && <span style={styles.outOfStockBadge}>نفذت الكمية</span>}
                    </div>

                    <div style={styles.productDetails}>
                      <h3 style={styles.productName}>{product.name}</h3>
                      <p style={styles.productSubtitle}>{product.subtitle}</p>
                      
                      <p style={{ fontSize: '0.8rem', color: isOutOfStock ? '#d9534f' : '#2b7a4b', marginBottom: '10px', fontWeight: '500' }}>
                        الحالة: {isOutOfStock ? 'نفذت الكمية من المخزن' : `متاح للشحن (${product.stock} قطع)`}
                      </p>

                      <div style={styles.optionsContainer}>
                        <div style={styles.optionGroup}>
                          <label style={styles.optionLabel}>الوزن:</label>
                          <select 
                            style={styles.selectInput}
                            value={currentOpts.weight}
                            onChange={(e) => handleOptionChange(product.id, 'weight', e.target.value)}
                            disabled={isOutOfStock}
                          >
                            <option value="250g">250 جرام</option>
                            <option value="500g">500 جرام (نصف كيلو)</option>
                            <option value="1000g">1000 جرام (1 كيلو)</option>
                          </select>
                        </div>

                        <div style={styles.optionGroup}>
                          <label style={styles.optionLabel}>درجة الطحن:</label>
                          <select 
                            style={styles.selectInput}
                            value={currentOpts.grind}
                            onChange={(e) => handleOptionChange(product.id, 'grind', e.target.value)}
                            disabled={isOutOfStock}
                          >
                            <option value="طحنة ناعمة (تركية)">طحنة ناعمة (تركية)</option>
                            <option value="حبوب كاملة (حصى)">حبوب كاملة (حصى)</option>
                            <option value="طحنة متوسطة (فلتر)">طحنة متوسطة (فلتر)</option>
                            <option value="طحنة إسبرسو">طحنة إسبرسو</option>
                          </select>
                        </div>
                      </div>

                      <div style={styles.priceRow}>
                        <div style={styles.priceTag}>{currentPrice} ج.م</div>
                        
                        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '10px' }}>
                          <button 
                            style={{
                              ...styles.addCartBtn,
                              flex: 1,
                              backgroundColor: isOutOfStock ? '#ccc' : '#3C2A21',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              transition: 'transform 0.15s ease, background-color 0.15s ease'
                            }} 
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock}
                          >
                            {isOutOfStock ? 'نفذت الكمية' : 'إضافة للسلة 🛒'}
                          </button>

                          <button 
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: isOutOfStock ? '#ccc' : '#2b7a4b',
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              transition: 'transform 0.15s ease, background-color 0.15s ease'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => {
                              if (!isOutOfStock) {
                                addToCart(product);
                                setActiveTab('cart');
                              }
                            }}
                            disabled={isOutOfStock}
                          >
                            اشتري الآن ⚡
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer id="contact-section" style={styles.contactFooter}>
            <div style={styles.footerContent}>
              <div style={styles.footerBrandCol}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <span style={{ fontSize: '2rem', cursor: 'pointer' }} onClick={handleSecretAdminTrigger} title="☕">☕</span>
                  <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#E5D9C5' }}>قهوة بريميوم</h3>
                </div>
                <p style={{ color: '#A8998C', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  علامة تجارية متخصصة في صناعة وتوريد أجود أنواع البن الكولومبي بخلطات وحمصات فريدة تناسب كل الأذواق.
                </p>
              </div>

              <div style={styles.footerContactCol}>
                <h4 style={{ color: '#C5A880', fontSize: '1.2rem', marginBottom: '15px' }}>تواصل معنا مباشر:</h4>
                <div style={styles.contactItem}>
                  <span>✉️ البريد الإلكتروني:</span>
                  <a href="mailto:mariammohamed1611962@gmail.com" style={styles.contactLink}>mariammohamed1611962@gmail.com</a>
                </div>
                <div style={styles.contactItem}>
                  <span>📞 رقم الهاتف :</span>
                  <a href="https://wa.me/201147554038" target="_blank" rel="noreferrer" style={styles.contactLink}>01147554038</a>
                </div>
              </div>
            </div>
            <div style={styles.footerBottomBar}>
              جميع الحقوق محفوظة © 2026 - قهوة بريميوم PREMIUM COFFEE
            </div>
          </footer>
        </main>
      )}

      {activeTab === 'cart' && (
        <div style={styles.cartPage}>
          <h2 style={styles.cartPageTitle}>سلة التسوق وإتمام الطلب</h2>
          
          {orderSuccess ? (
            <div style={styles.successBox}>
              <h3 style={{ color: '#2b7a4b', marginBottom: '10px' }}>تم إرسال طلبك بنجاح! 🎉</h3>
              <p>تم تسجيل طلبك ومتابعة حالته من قبل إدارة المتجر.</p>
              {lastOrderId && <p style={{ marginTop: '8px' }}>رقم طلبك: <strong>{lastOrderId}</strong></p>}
              <button style={{ ...styles.primaryBtn, marginTop: '20px' }} onClick={() => { setOrderSuccess(false); setActiveTab('shop'); }}>
                العودة للتسوق
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div style={styles.emptyCart}>
              <p>سلة التسوق فارغة حالياً.</p>
              <button style={styles.primaryBtn} onClick={() => setActiveTab('shop')}>العودة للمتجر</button>
            </div>
          ) : (
            <div style={styles.cartLayout}>
              <div style={styles.cartItemsCol}>
                {cart.map(item => (
                  <div key={item.cartKey} style={styles.cartItemRow}>
                    <img src={item.image} alt={item.name} style={styles.cartItemImg} />
                    <div style={styles.cartItemDetails}>
                      <h4>{item.name}</h4>
                      <p style={styles.cartMeta}>الوزن: {item.weight} | الطحن: {item.grind}</p>
                      <span style={styles.cartItemPrice}>{item.price} ج.م</span>
                    </div>

                    <div style={styles.qtyControls}>
                      <button style={styles.qtyBtn} onClick={() => updateQty(item.cartKey, -1)}>-</button>
                      <span style={styles.qtyNum}>{item.qty}</span>
                      <button style={styles.qtyBtn} onClick={() => updateQty(item.cartKey, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.summaryCard}>
                <h3>بيانات الشحن والفاتورة</h3>
                <form onSubmit={handleCheckoutSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>الاسم بالكامل:</label>
                    <input type="text" style={styles.formInput} placeholder="اكتب اسمك هنا" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>رقم الهاتف:</label>
                    <input type="text" style={styles.formInput} placeholder="01xxxxxxxxx" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>عنوان التوصيل:</label>
                    <textarea style={styles.formTextarea} placeholder="المدينة، الشارع..." value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} required />
                  </div>

                  <hr style={styles.hr} />

                  <div style={styles.summaryRow}>
                    <span>إجمالي المنتجات:</span>
                    <span>{cartTotal} ج.م</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>مصاريف التوصيل:</span>
                    <span>{deliveryFee === 0 ? 'مجاني' : `${deliveryFee} ج.م`}</span>
                  </div>
                  <hr style={styles.hr} />
                  <div style={{ ...styles.summaryRow, fontWeight: 'bold', fontSize: '1.2rem', color: '#3C2A21' }}>
                    <span>الإجمالي النهائي:</span>
                    <span>{grandTotal} ج.م</span>
                  </div>

                  {orderError && <p role="alert" style={{ color: '#d9534f', fontSize: '0.9rem', marginTop: '12px' }}>{orderError}</p>}
                  <button type="submit" style={{ ...styles.submitOrderBtn, opacity: isSubmittingOrder ? 0.7 : 1 }} disabled={isSubmittingOrder}>
                    {isSubmittingOrder ? 'جاري إرسال الطلب...' : 'إتمام الطلب الآن 📦'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'admin' && (
        <div style={styles.adminPage}>
          {!isAuthenticated ? (
            <div style={styles.loginCard}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔒</div>
              <h2 style={{ marginBottom: '10px', color: '#3C2A21' }}>تسجيل دخول لوحة التحكم</h2>
              <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '20px' }}>أدخل كلمة مرور صاحب المتجر للوصول لأدوات الإدارة.</p>
              <form onSubmit={handleAdminLogin}>
                <div style={{ marginBottom: '15px', textAlign: 'right' }}>
                  <label style={styles.formLabel}>كلمة المرور:</label>
                  <input type="password" placeholder="أدخل كلمة المرور" style={styles.formInput} value={enteredPassword} onChange={(e) => setEnteredPassword(e.target.value)} required />
                </div>
                {passwordError && <p style={{ color: '#d9534f', fontSize: '0.85rem', marginBottom: '15px' }}>{passwordError}</p>}
                <button type="submit" style={{ ...styles.primaryBtn, width: '100%', borderRadius: '8px' }}>دخول للوحة التحكم</button>
              </form>
              <button style={{ ...styles.secondaryBtn, width: '100%', marginTop: '10px', fontSize: '0.85rem' }} onClick={() => setActiveTab('shop')}>العودة للمتجر</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <h2 style={styles.adminTitle}>لوحة تحكم المتجر (خاصة بالمدير فقط)</h2>
                  <p style={styles.adminSub}>تعديل الأسعار، الكميات، الحذف ومتابعة إحصائيات المبيعات.</p>
                </div>
                <button style={{ ...styles.secondaryBtn, padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleLogout}>تسجيل الخروج 🚪</button>
              </div>

              <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, borderRight: '4px solid #3C2A21' }}>
                  <div style={styles.statIcon}>💰</div>
                  <div>
                    <span style={styles.statTitle}>إجمالي المبيعات</span>
                    <h3 style={styles.statNumber}>{totalSales} ج.م</h3>
                    <p style={styles.statSub}>الطلبات المستلمة بالفعل</p>
                  </div>
                </div>

                <div style={{ ...styles.statCard, borderRight: '4px solid #8C6D58' }}>
                  <div style={styles.statIcon}>☕</div>
                  <div>
                    <span style={styles.statTitle}>عدد المنتجات</span>
                    <h3 style={styles.statNumber}>{products.length} منتجات</h3>
                    <p style={styles.statSub}>في قائمة المتجر</p>
                  </div>
                </div>

                <div style={{ ...styles.statCard, borderRight: '4px solid #856404', backgroundColor: '#FFFDF5' }}>
                  <div style={styles.statIcon}>🟡</div>
                  <div>
                    <span style={styles.statTitle}>طلبات جديدة</span>
                    <h3 style={{ ...styles.statNumber, color: '#856404' }}>{countNewOrders}</h3>
                    <p style={styles.statSub}>تنتظر التجهيز</p>
                  </div>
                </div>

                <div style={{ ...styles.statCard, borderRight: '4px solid #004085', backgroundColor: '#F0F7FF' }}>
                  <div style={styles.statIcon}>🚚</div>
                  <div>
                    <span style={styles.statTitle}>جاري الشحن</span>
                    <h3 style={{ ...styles.statNumber, color: '#004085' }}>{countShippingOrders}</h3>
                    <p style={styles.statSub}>في الطريق للعميل</p>
                  </div>
                </div>

                <div style={{ ...styles.statCard, borderRight: '4px solid #155724', backgroundColor: '#F3F9F4' }}>
                  <div style={styles.statIcon}>✅</div>
                  <div>
                    <span style={styles.statTitle}>تم التسليم</span>
                    <h3 style={{ ...styles.statNumber, color: '#155724' }}>{countDeliveredOrders}</h3>
                    <p style={styles.statSub}>طلبات مكتملة</p>
                  </div>
                </div>

                <div style={{ ...styles.statCard, borderRight: '4px solid #721C24', backgroundColor: '#FFF5F5' }}>
                  <div style={styles.statIcon}>❌</div>
                  <div>
                    <span style={styles.statTitle}>طلبات ملغية</span>
                    <h3 style={{ ...styles.statNumber, color: '#721C24' }}>{countCancelledOrders}</h3>
                    <p style={styles.statSub}>طلبات مرفوضة/ملغاة</p>
                  </div>
                </div>
              </div>

              <div style={styles.securitySection}>
                <h3 style={{ marginBottom: '15px', color: '#3C2A21' }}>📦 إدارة مخزون وأسعار المنتجات (تعديل / حذف):</h3>
                
                {editingProduct ? (
                  <form onSubmit={handleSaveEditProduct} style={{ backgroundColor: '#FAF8F5', padding: '20px', borderRadius: '8px', border: '1px solid #EAE3D9', marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '15px' }}>تعديل المنتج: {editingProduct.name}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={styles.formLabel}>اسم المنتج:</label>
                        <input type="text" style={styles.formInput} value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
                      </div>
                      <div>
                        <label style={styles.formLabel}>السعر الأساسي (لـ 500ج):</label>
                        <input type="number" style={styles.formInput} value={editingProduct.priceBase} onChange={e => setEditingProduct({...editingProduct, priceBase: Number(e.target.value)})} required />
                      </div>
                      <div>
                        <label style={styles.formLabel}>الكمية في المخزن:</label>
                        <input type="number" style={styles.formInput} value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} required />
                      </div>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                      <label style={styles.formLabel}>تغيير صورة المنتج (اختر صورة جديدة أو اترك الحالية):</label>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} style={{ ...styles.formInput, padding: '6px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button type="submit" style={{ ...styles.primaryBtn, padding: '8px 20px' }}>حفظ التعديلات</button>
                      <button type="button" style={{ ...styles.secondaryBtn, padding: '8px 20px' }} onClick={() => setEditingProduct(null)}>إلغاء</button>
                    </div>
                  </form>
                ) : null}

                <div style={styles.tableResponsive}>
                  <table style={styles.adminTable}>
                    <thead>
                      <tr>
                        <style>{`
                          th { padding: 12px; border-bottom: 2px solid #ddd; text-align: right; background: #f4f1ea; color: #3C2A21; }
                          td { padding: 12px; border-bottom: 1px solid #eee; text-align: right; vertical-align: middle; }
                        `}</style>
                        <th>الصورة</th>
                        <th>اسم المنتج</th>
                        <th>التصنيف</th>
                        <th>السعر الأساسي</th>
                        <th>المخزن</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td><img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /></td>
                          <td><strong>{p.name}</strong><br/><span style={{ fontSize: '0.75rem', color: '#666' }}>{p.subtitle}</span></td>
                          <td><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E2E3E5', fontSize: '0.8rem' }}>{p.category}</span></td>
                          <td>{p.priceBase} ج.م</td>
                          <td>
                            <span style={{ fontWeight: 'bold', color: p.stock > 0 ? '#155724' : '#721C24' }}>
                              {p.stock} قطع
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button style={{ ...styles.secondaryBtn, padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => setEditingProduct(p)}>تعديل ✏️</button>
                              <button style={{ ...styles.secondaryBtn, padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#F8D7DA', color: '#721C24', border: '1px solid #F5C6CB' }} onClick={() => handleDeleteProduct(p.id)}>حذف 🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ ...styles.securitySection, marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#3C2A21' }}>➕ إضافة منتج جديد للمتجر:</h3>
                <form onSubmit={handleAddProductSubmit} style={{ backgroundColor: '#FAF8F5', padding: '20px', borderRadius: '8px', border: '1px solid #EAE3D9' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={styles.formLabel}>اسم المنتج:</label>
                      <input type="text" style={styles.formInput} placeholder="مثال: بن كولومبي خاص" value={newProductForm.name} onChange={e => setNewProductForm({...newProductForm, name: e.target.value})} required />
                    </div>
                    <div>
                      <label style={styles.formLabel}>الوصف المختصر:</label>
                      <input type="text" style={styles.formInput} placeholder="مثال: تحميص وسط" value={newProductForm.subtitle} onChange={e => setNewProductForm({...newProductForm, subtitle: e.target.value})} />
                    </div>
                    <div>
                      <label style={styles.formLabel}>السعر الأساسي (لـ 500ج):</label>
                      <input type="number" style={styles.formInput} placeholder="290" value={newProductForm.priceBase} onChange={e => setNewProductForm({...newProductForm, priceBase: e.target.value})} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                    <div>
                      <label style={styles.formLabel}>التصنيف:</label>
                      <select style={styles.selectInput} value={newProductForm.category} onChange={e => setNewProductForm({...newProductForm, category: e.target.value})}>
                        <option value="محوج">محوج</option>
                        <option value="سادة">سادة</option>
                        <option value="نكهات">نكهات</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.formLabel}>الكمية المتاحة في المخزن:</label>
                      <input type="number" style={styles.formInput} value={newProductForm.stock} onChange={e => setNewProductForm({...newProductForm, stock: e.target.value})} required />
                    </div>
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <label style={styles.formLabel}>صورة المنتج (اختر صورة من جهازك):</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} style={{ ...styles.formInput, padding: '6px' }} required />
                  </div>

                  {newProductForm.image && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#2b7a4b' }}>تم اختيار الصورة بنجاح ✓</span>
                      <img src={newProductForm.image} alt="معاينة" style={{ width: '50px', height: '50px', objectFit: 'cover', display: 'block', marginTop: '5px', borderRadius: '4px' }} />
                    </div>
                  )}

                  <button type="submit" style={{ ...styles.primaryBtn, marginTop: '20px', padding: '10px 25px' }}>إضافة المنتج للمتجر 🚀</button>
                </form>
              </div>

              <div style={{ ...styles.securitySection, marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#3C2A21' }}>📋 سجل طلبات العملاء:</h3>
                {orders.length === 0 ? (
                  <p style={{ color: '#666' }}>لا توجد طلبات مسجلة حتى الآن.</p>
                ) : (
                  <div style={styles.tableResponsive}>
                    <table style={styles.adminTable}>
                      <thead>
                        <tr>
                          <th>رقم الطلب</th>
                          <th>التاريخ</th>
                          <th>العميل ورقم الهاتف</th>
                          <th>العنوان</th>
                          <th>المنتجات والتفاصيل</th>
                          <th>الإجمالي</th>
                          <th>الحالة الحالية</th>
                          <th>تغيير الحالة / حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o?.id}>
                            <td><strong>{o?.id}</strong></td>
                            <td style={{ fontSize: '0.85rem' }}>{formatOrderDate(o?.created_at)}</td>
                            <td>{o?.customer_name}<br/><a href={`https://wa.me/20${o?.customer_phone?.replace(/^0+/, '')}`} target="_blank" rel="noreferrer" style={{ color: '#2b7a4b', fontSize: '0.85rem' }}>{o?.customer_phone}</a></td>
                            <td style={{ fontSize: '0.85rem', maxWidth: '150px' }}>{o?.shipping_address}</td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {o?.items?.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: '4px' }}>
                                  • {item.name} ({item.weight} - {item.grind}) × {item.qty}
                                </div>
                              ))}
                            </td>
                            <td><strong>{o?.total} ج.م</strong></td>
                            <td>
                              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', ...getStatusBadgeStyle(o?.status) }}>
                                {o?.status || 'جديد'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <select 
                                  style={{ ...styles.selectInput, fontSize: '0.8rem', padding: '4px' }}
                                  value={o?.status || 'جديد'}
                                  onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                >
                                  <option value="جديد">جديد</option>
                                  <option value="جاري الشحن">جاري الشحن</option>
                                  <option value="تم التسليم">تم التسليم</option>
                                  <option value="ملغي">ملغي</option>
                                </select>
                                <button style={{ ...styles.secondaryBtn, padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#F8D7DA', color: '#721C24', border: '1px solid #F5C6CB' }} onClick={() => handleDeleteOrder(o.id)}>حذف الطلب</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  appContainer: {
    fontFamily: 'Cairo, sans-serif',
    backgroundColor: '#FAF8F5',
    color: '#333333',
    minHeight: '100vh',
    direction: 'rtl',
    textAlign: 'right',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #EAE3D9',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topBanner: {
    backgroundColor: '#3C2A21',
    color: '#E5D9C5',
    textAlign: 'center',
    padding: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  navBar: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: '#3C2A21',
  },
  logoSub: {
    display: 'block',
    fontSize: '0.65rem',
    color: '#8C6D58',
    letterSpacing: '1px',
  },
  navLinks: {
    display: 'flex',
    gap: '20px',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    color: '#3C2A21',
    padding: '5px 0',
  },
  cartIconContainer: {
    position: 'relative',
    cursor: 'pointer',
    backgroundColor: '#F4F1EA',
    padding: '8px 12px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: '1.2rem',
  },
  cartBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#3C2A21',
    color: '#FFFFFF',
    fontSize: '0.75rem',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  mainContent: {
    minHeight: '80vh',
  },
  heroSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 20px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    alignItems: 'center',
  },
  heroTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  heroTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#3C2A21',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '1.05rem',
    color: '#666',
    lineHeight: '1.6',
  },
  heroButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
  },
  primaryBtn: {
    backgroundColor: '#3C2A21',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    color: '#3C2A21',
    border: '1px solid #3C2A21',
    padding: '12px 25px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  heroImageCard: {
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  },
  heroImg: {
    width: '100%',
    height: '400px',
    objectFit: 'cover',
    display: 'block',
  },
  sectionPadding: {
    padding: '60px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  curationsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    alignItems: 'center',
  },
  curationTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionTitleLarge: {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    color: '#3C2A21',
    lineHeight: '1.2',
  },
  discoverLink: {
    color: '#3C2A21',
    fontWeight: 'bold',
    textDecoration: 'none',
    fontSize: '0.95rem',
  },
  archImageWrapper: {
    borderRadius: '12px',
    overflow: 'hidden',
    marginTop: '20px',
    height: '250px',
  },
  archImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  curationFeaturedCol: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    height: '400px',
  },
  featuredBagImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  featuredOverlayText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    color: '#FFFFFF',
    padding: '25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  sectionHeaderCenter: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#3C2A21',
    marginBottom: '10px',
  },
  sectionSub: {
    color: '#666',
    fontSize: '0.95rem',
    marginBottom: '20px',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '8px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '25px',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #EAE3D9',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  },
  productImgContainer: {
    position: 'relative',
    height: '220px',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#3C2A21',
    color: '#FFFFFF',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: '#d9534f',
    color: '#FFFFFF',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  productDetails: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  productName: {
    fontSize: '1.15rem',
    fontWeight: 'bold',
    color: '#3C2A21',
    marginBottom: '5px',
  },
  productSubtitle: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '15px',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
  },
  optionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  optionLabel: {
    fontSize: '0.8rem',
    color: '#555',
    fontWeight: '600',
  },
  selectInput: {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #D8CEC4',
    backgroundColor: '#FAF8F5',
    fontSize: '0.85rem',
    color: '#333',
    outline: 'none',
  },
  priceRow: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '15px',
    borderTop: '1px solid #F0ECE6',
  },
  priceTag: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#3C2A21',
  },
  addCartBtn: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
  contactFooter: {
    backgroundColor: '#261A13',
    color: '#FFFFFF',
    padding: '50px 20px 20px 20px',
    marginTop: '60px',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '40px',
    marginBottom: '40px',
  },
  footerBrandCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  footerContactCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  contactItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    fontSize: '0.9rem',
    color: '#A8998C',
  },
  contactLink: {
    color: '#E5D9C5',
    textDecoration: 'none',
    fontWeight: '500',
  },
  footerBottomBar: {
    maxWidth: '1200px',
    margin: '0 auto',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '20px',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#8C7A6B',
  },
  cartPage: {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '0 20px',
  },
  cartPageTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#3C2A21',
    marginBottom: '30px',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #C3E6CB',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  },
  emptyCart: {
    backgroundColor: '#FFFFFF',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #EAE3D9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  cartLayout: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '30px',
  },
  cartItemsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  cartItemRow: {
    backgroundColor: '#FFFFFF',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #EAE3D9',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  cartItemImg: {
    width: '70px',
    height: '70px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  cartItemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cartMeta: {
    fontSize: '0.8rem',
    color: '#666',
  },
  cartItemPrice: {
    fontWeight: 'bold',
    color: '#3C2A21',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FAF8F5',
    padding: '5px 10px',
    borderRadius: '6px',
    border: '1px solid #EAE3D9',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#3C2A21',
  },
  qtyNum: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    minWidth: '20px',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #EAE3D9',
    height: 'fit-content',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  },
  formGroup: {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  formLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#444',
  },
  formInput: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #D8CEC4',
    backgroundColor: '#FAF8F5',
    fontSize: '0.9rem',
    outline: 'none',
  },
  formTextarea: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #D8CEC4',
    backgroundColor: '#FAF8F5',
    fontSize: '0.9rem',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #EAE3D9',
    margin: '15px 0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '0.95rem',
    color: '#555',
  },
  submitOrderBtn: {
    width: '100%',
    backgroundColor: '#2b7a4b',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '15px',
    boxShadow: '0 4px 10px rgba(43,122,75,0.2)',
  },
  adminPage: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
  },
  loginCard: {
    maxWidth: '400px',
    margin: '60px auto',
    backgroundColor: '#FFFFFF',
    padding: '40px',
    borderRadius: '12px',
    border: '1px solid #EAE3D9',
    textAlign: 'center',
    boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
  },
  adminTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#3C2A21',
    marginBottom: '5px',
  },
  adminSub: {
    color: '#666',
    fontSize: '0.9rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid #EAE3D9',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  statIcon: {
    fontSize: '2rem',
  },
  statTitle: {
    fontSize: '0.8rem',
    color: '#666',
  },
  statNumber: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#3C2A21',
    margin: '2px 0',
  },
  statSub: {
    fontSize: '0.75rem',
    color: '#888',
  },
  securitySection: {
    backgroundColor: '#FFFFFF',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #EAE3D9',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  adminTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
};

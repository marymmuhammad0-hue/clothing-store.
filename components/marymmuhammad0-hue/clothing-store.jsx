'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const ALL_COLORS = ['أسود', 'أبيض', 'كحلي', 'بيج', 'زيتي'];

const translations = {
  ar: {
    topBanner: 'شحن مجاني للطلبات الأكثر من 1500 ج.م لكافة المحافظات 🚚',
    storeName: 'فاشون ستور',
    navHome: 'الرئيسية',
    navContact: 'تواصل معنا',
    heroTitle: 'ELEVATE YOUR DAILY CASUAL STYLE',
    heroSub: 'أحدث تشكيلة ملابس كاجوال مريحة بأعلى خامات القطن والتقفيل الممتاز، لتستمتع بإطلالة عصريّة وأنيقة يومياً.',
    shopNow: 'تسوق الآن 🛍️',
    sectionTitle: 'تشكيلة أزياء الكاجوال',
    sectionSub: 'اختر القطعة، اللون، والمقاس المناسب لك',
    all: 'الكل',
    tshirts: 'تيشرتات',
    pants: 'بنطلونات',
    hoodies: 'هوديز وسويت شيرت',
    jackets: 'جاكيتات',
    size: 'المقاس (Size)',
    color: 'اللون (Color)',
    addToCart: 'إضافة للسلة 🛍️',
    addedToCart: 'تمت الإضافة ✓',
    buyNow: 'اشتري الآن ⚡',
    outOfStock: 'نفذت الكمية',
    available: 'متاح للشحن',
    cartTitle: 'سلة التسوق وإتمام الطلب',
    cartEmpty: 'سلة التسوق فارغة حالياً.',
    browseClothes: 'تصفح الملابس',
    shippingDetails: 'بيانات الشحن والفاتورة',
    fullName: 'الاسم بالكامل:',
    phone: 'رقم الهاتف:',
    address: 'عنوان التوصيل التفصيلي:',
    subtotal: 'إجمالي المنتجات:',
    shippingFee: 'مصاريف الشحن:',
    free: 'مجاني 🎉',
    total: 'الإجمالي النهائي:',
    confirmOrder: 'تأكيد وإتمام الطلب 📦',
    submittingOrder: 'جاري تسجيل الطلب...',
    orderSuccess: 'تم إرسال طلبك بنجاح! 🎉',
    orderSuccessSub: 'تم تسجيل طلبك ومتابعة تجهيزه للشحن فوراً.',
    orderId: 'رقم طلبك:',
    continueShopping: 'متابعة التسوق',
    footerDesc: 'علامة تجارية متخصصة في توفير أرقى وأحدث صيحات الملابس الكاجوال المريحة بأعلى معايير التصنيع والجودة.',
    footerContact: 'تواصل معنا مباشر:',
    footerEmail: '✉️ البريد الإلكتروني:',
    footerPhone: '📞 رقم الهاتف / واتساب:',
    footerRights: 'جميع الحقوق محفوظة © 2026 - فاشون ستور FASHION STORE',
    adminTitle: 'لوحة تحكم FASHION STORE',
    adminSub: 'إدارة المخزون، الإحصائيات المباشرة، وتتبع الطلبات.',
    statTotalSales: 'إجمالي المبيعات المستلمة',
    statTotalOrders: 'إجمالي الطلبات',
    statNewOrders: 'طلبات جديدة 🆕',
    statShippingOrders: 'جاري الشحن 🚚',
    statDeliveredOrders: 'تم التسليم ✅',
    statCancelledOrders: 'ملغية ❌',
    addNewProduct: '➕ إضافة قطعة ملابس جديدة:',
    productName: 'اسم المنتج:',
    subtitle: 'وصف مختصر:',
    price: 'السعر (ج.م):',
    category: 'التصنيف:',
    stockQty: 'الكمية المتاحة:',
    selectSizes: '📏 المقاسات المتاحة لهذه القطعة:',
    customSizesLabel: 'أو أضف مقاسات أخرى خاصة (افصل بينها بفاصلة `,`):',
    selectColors: '🎨 الألوان المتاحة لهذه القطعة:',
    customColorsLabel: 'أو أضف ألواناً أخرى خاصة (افصل بينها بفاصلة `,`):',
    productImages: 'صور المنتج:',
    submitProduct: 'إضافة القطعة 🚀',
    currentProducts: '📦 المنتجات الحالية المتاحة بالمتجر:',
    noProducts: 'لا توجد منتجات مضافة حالياً.',
    tableImages: 'الصور',
    tableName: 'اسم القطعة',
    tableCategory: 'التصنيف',
    tableSizes: 'المقاسات المتاحة',
    tableColors: 'الألوان المتاحة',
    tablePrice: 'السعر',
    tableStock: 'المخزن',
    tableActions: 'الإجراءات',
    deleteBtn: 'حذف 🗑️',
    orderLog: '📋 سجل الطلبات والشحن المباشر:',
    noOrders: 'لا توجد طلبات مسجلة حتى الآن.',
    tableOrderId: 'رقم الطلب',
    tableDate: 'التاريخ',
    tableCustomer: 'اسم العميل',
    tablePhone: 'رقم الموبايل',
    tableAddress: 'عنوان الشحن',
    tableItems: 'تفاصيل العناصر',
    tableTotal: 'الإجمالي',
    tableStatus: 'الحالة',
    loginTitle: 'لوحة تحكم المتجر',
    loginSub: 'أدخل كلمة مرور المدير لإدارة الملابس والطلبات.',
    passwordLabel: 'كلمة المرور:',
    loginBtn: 'دخول اللوحة',
    backToStore: 'العودة للمتجر',
    logoutBtn: 'تسجيل الخروج 🚪',
    settingsBtn: 'الإعدادات ⚙️',
    changePasswordTitle: '⚙️ إعدادات كلمة المرور',
    currentPasswordLabel: 'كلمة المرور الحالية:',
    newPasswordLabel: 'كلمة المرور الجديدة:',
    confirmNewPasswordLabel: 'تأكيد كلمة المرور الجديدة:',
    savePasswordBtn: 'حفظ كلمة المرور 💾',
  },
  en: {
    topBanner: 'Free shipping on orders over 1500 EGP nationwide 🚚',
    storeName: 'FASHION STORE',
    navHome: 'Home',
    navContact: 'Contact Us',
    heroTitle: 'ELEVATE YOUR DAILY CASUAL STYLE',
    heroSub: 'Discover our latest premium casual clothing collection crafted with high-quality cotton for daily elegance and comfort.',
    shopNow: 'Shop Now 🛍️',
    sectionTitle: 'Casual Wear Collection',
    sectionSub: 'Choose your preferred piece, size, and color',
    all: 'All',
    tshirts: 'T-Shirts',
    pants: 'Pants',
    hoodies: 'Hoodies & Sweatshirts',
    jackets: 'Jackets',
    size: 'Size',
    color: 'Color',
    addToCart: 'Add to Cart 🛍️',
    addedToCart: 'Added ✓',
    buyNow: 'Buy Now ⚡',
    outOfStock: 'Out of Stock',
    available: 'In Stock',
    cartTitle: 'Shopping Cart & Checkout',
    cartEmpty: 'Your shopping cart is currently empty.',
    browseClothes: 'Browse Collection',
    shippingDetails: 'Shipping & Invoice Details',
    fullName: 'Full Name:',
    phone: 'Phone Number:',
    address: 'Detailed Shipping Address:',
    subtotal: 'Products Subtotal:',
    shippingFee: 'Shipping Fee:',
    free: 'Free 🎉',
    total: 'Grand Total:',
    confirmOrder: 'Confirm & Complete Order 📦',
    submittingOrder: 'Submitting Order...',
    orderSuccess: 'Order Placed Successfully! 🎉',
    orderSuccessSub: 'Your order has been recorded and is being prepared for shipping.',
    orderId: 'Order ID:',
    continueShopping: 'Continue Shopping',
    footerDesc: 'A leading brand dedicated to providing the latest comfortable casual fashion with premium quality and craftsmanship.',
    footerContact: 'Direct Contact:',
    footerEmail: '✉️ Email:',
    footerPhone: '📞 Phone / WhatsApp:',
    footerRights: 'All Rights Reserved © 2026 - FASHION STORE',
    adminTitle: 'FASHION STORE Dashboard',
    adminSub: 'Manage inventory, real-time analytics, and track customer orders.',
    statTotalSales: 'Total Received Sales',
    statTotalOrders: 'Total Orders',
    statNewOrders: 'New Orders 🆕',
    statShippingOrders: 'In Shipping 🚚',
    statDeliveredOrders: 'Delivered ✅',
    statCancelledOrders: 'Cancelled ❌',
    addNewProduct: '➕ Add New Item:',
    productName: 'Product Name:',
    subtitle: 'Short Subtitle:',
    price: 'Price (EGP):',
    category: 'Category:',
    stockQty: 'Stock Quantity:',
    selectSizes: '📏 Available Sizes for this Item:',
    customSizesLabel: 'Or add custom sizes (separated by comma `,`):',
    selectColors: '🎨 Available Colors for this Item:',
    customColorsLabel: 'Or add custom colors (separated by comma `,`):',
    productImages: 'Product Images:',
    submitProduct: 'Add Product 🚀',
    currentProducts: '📦 Current Products Available in Store:',
    noProducts: 'No products currently available.',
    tableImages: 'Images',
    tableName: 'Product Name',
    tableCategory: 'Category',
    tableSizes: 'Sizes',
    tableColors: 'Colors',
    tablePrice: 'Price',
    tableStock: 'Stock',
    tableActions: 'Actions',
    deleteBtn: 'Delete 🗑️',
    orderLog: '📋 Real-Time Orders Log:',
    noOrders: 'No registered orders found.',
    tableOrderId: 'Order ID',
    tableDate: 'Date',
    tableCustomer: 'Customer Name',
    tablePhone: 'Phone Number',
    tableAddress: 'Shipping Address',
    tableItems: 'Items Details',
    tableTotal: 'Total',
    tableStatus: 'Status',
    loginTitle: 'Store Admin Panel',
    loginSub: 'Enter admin password to manage products and orders.',
    passwordLabel: 'Password:',
    loginBtn: 'Login to Panel',
    backToStore: 'Back to Store',
    logoutBtn: 'Logout 🚪',
    settingsBtn: 'Settings ⚙️',
    changePasswordTitle: '⚙️ Password Settings',
    currentPasswordLabel: 'Current Password:',
    newPasswordLabel: 'New Password:',
    confirmNewPasswordLabel: 'Confirm New Password:',
    savePasswordBtn: 'Save Password 💾',
  }
};

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
  if (!res.ok) throw new Error(data?.error || 'Error occurred, please try again.');
  return data;
}

const fetchProducts = (url) => apiRequest(url);
const fetchOrders = ([url, adminPassword]) => apiRequest(url, { adminPassword });

const formatOrderDate = (iso) => {
  try { return new Date(iso).toLocaleDateString('en-US'); } catch (e) { return ''; }
};

export default function App() {
  const [lang, setLang] = useState('ar');
  const t = translations[lang] || translations.ar;

  useEffect(() => {
    const savedLang = localStorage.getItem('fashion_store_lang');
    if (savedLang) {
      setLang(savedLang);
    } else {
      const deviceLang = navigator.language || navigator.userLanguage || 'ar';
      setLang(deviceLang.toLowerCase().startsWith('ar') ? 'ar' : 'en');
    }
  }, []);

  const toggleLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('fashion_store_lang', newLang);
  };

  const { data: products = [], error: productsError, isLoading: productsLoading, mutate: mutateProducts } =
    useSWR('/api/products', fetchProducts);

  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('shop');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedImages, setSelectedImages] = useState({});
  const [cartAnimate, setCartAnimate] = useState(false);
  const [buttonFeedback, setButtonFeedback] = useState({});

  useEffect(() => {
    const savedCart = localStorage.getItem('fashion_store_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error("Error reading cart", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fashion_store_cart', JSON.stringify(cart));
  }, [cart]);

  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [footerClicks, setFooterClicks] = useState(0);

  const [showSettings, setShowSettings] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [passMessage, setPassMessage] = useState({ text: '', type: '' });

  const { data: orders = [], mutate: mutateOrders } = useSWR(
    isAuthenticated ? ['/api/orders', adminPassword] : null,
    fetchOrders
  );

  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  const [newProductForm, setNewProductForm] = useState({
    name: '',
    subtitle: '',
    priceBase: '',
    category: 'تيشرتات',
    images: [],
    stock: '10',
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    customSizes: '',
    availableColors: ['أسود', 'أبيض', 'كحلي', 'بيج', 'زيتي'],
    customColors: ''
  });

  const [productOptions, setProductOptions] = useState({});

  const handleMultipleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let loadedImages = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`Image ${file.name} size is too large.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        loadedImages.push(reader.result);
        filesProcessed++;
        if (filesProcessed === files.length) {
          setNewProductForm(prev => ({ ...prev, images: [...prev.images, ...loadedImages] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCheckboxChange = (field, value) => {
    setNewProductForm(prev => {
      const currentList = prev[field];
      const updatedList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      return { ...prev, [field]: updatedList };
    });
  };

  const handleOptionChange = (productId, field, value) => {
    setProductOptions(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value }
    }));
  };

  const parseProductImages = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (typeof product.image === 'string' && product.image.startsWith('[')) {
      try { return JSON.parse(product.image); } catch (e) { return [product.image]; }
    }
    return product.image ? [product.image] : [];
  };

  // دالة قراءة آمنة مع دعم القيم الافتراضية
  const parseProductList = (rawVal, defaultFallback) => {
    if (!rawVal) return defaultFallback;
    if (Array.isArray(rawVal) && rawVal.length > 0) return rawVal;
    
    if (typeof rawVal === 'string') {
      const trimmed = rawVal.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
      const splitVal = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      if (splitVal.length > 0) return splitVal;
    }
    return defaultFallback;
  };

  const triggerCartAnimation = () => {
    setCartAnimate(true);
    setTimeout(() => setCartAnimate(false), 600);
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert(lang === 'ar' ? 'عذراً، هذا المنتج نفذ من المخزن حالياً.' : 'Sorry, this product is out of stock.');
      return;
    }

    const availSizes = parseProductList(product.available_sizes || product.availableSizes, ALL_SIZES);
    const availColors = parseProductList(product.available_colors || product.availableColors, ALL_COLORS);

    const opts = productOptions[product.id] || {
      size: availSizes[0] || 'M',
      color: availColors[0] || 'أسود'
    };

    const finalPrice = product.priceBase || product.price_base;
    const itemKey = `${product.id}-${opts.size}-${opts.color}`;
    const productImgs = parseProductImages(product);

    setCart(prevCart => {
      const existing = prevCart.find(item => item.cartKey === itemKey);
      if (existing) {
        return prevCart.map(item => item.cartKey === itemKey ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prevCart, {
        cartKey: itemKey,
        id: product.id,
        name: product.name,
        image: productImgs[0] || '',
        size: opts.size,
        color: opts.color,
        price: finalPrice,
        qty: 1
      }];
    });

    triggerCartAnimation();
    setButtonFeedback(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setButtonFeedback(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
    triggerCartAnimation();
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = cartTotal > 1500 ? 0 : 50;
  const grandTotal = cartTotal + deliveryFee;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingOrder) return;
    if (!customerForm.name || !customerForm.phone || !customerForm.address) {
      alert(lang === 'ar' ? 'يرجى استكمال جميع بيانات الشحن أولاً.' : 'Please fill in all shipping details.');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError('');
    try {
      const created = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: {
            name: customerForm.name,
            phone: customerForm.phone,
            address: customerForm.address
          },
          items: cart.map(i => ({
            productId: i.id,
            name: i.name,
            size: i.size,
            color: i.color,
            qty: i.qty,
            price: i.price
          })),
          total: grandTotal
        }),
      });

      setLastOrderId(created?.id || 'ORD-' + Math.floor(1000 + Math.random() * 9000));
      setOrderSuccess(true);
      setCart([]);
      localStorage.removeItem('fashion_store_cart');
      setCustomerForm({ name: '', phone: '', address: '' });
      mutateProducts();
      if (isAuthenticated) mutateOrders();
    } catch (err) {
      setOrderError(err.message || 'Error executing order, please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.priceBase) return;
    if (newProductForm.images.length === 0) {
      alert(lang === 'ar' ? 'يرجى اختيار صورة واحدة على الأقل للمنتج.' : 'Please select at least one image.');
      return;
    }

    const extraSizes = newProductForm.customSizes
      ? newProductForm.customSizes.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const finalSizes = Array.from(new Set([...newProductForm.availableSizes, ...extraSizes]));

    const extraColors = newProductForm.customColors
      ? newProductForm.customColors.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    const finalColors = Array.from(new Set([...newProductForm.availableColors, ...extraColors]));

    if (finalSizes.length === 0) {
      alert(lang === 'ar' ? 'يرجى اختيار أو كتابة مقاس واحد على الأقل.' : 'Please select or type at least one size.');
      return;
    }
    if (finalColors.length === 0) {
      alert(lang === 'ar' ? 'يرجى اختيار أو كتابة لون واحد على الأقل.' : 'Please select or type at least one color.');
      return;
    }

    try {
      await apiRequest('/api/products', {
        method: 'POST',
        adminPassword,
        body: JSON.stringify({
          name: newProductForm.name,
          subtitle: newProductForm.subtitle,
          priceBase: Number(newProductForm.priceBase),
          category: newProductForm.category,
          image: JSON.stringify(newProductForm.images),
          stock: Number(newProductForm.stock) || 0,
          available_sizes: JSON.stringify(finalSizes),
          available_colors: JSON.stringify(finalColors),
          availableSizes: JSON.stringify(finalSizes),
          availableColors: JSON.stringify(finalColors)
        }),
      });
      mutateProducts();
      setNewProductForm({
        name: '',
        subtitle: '',
        priceBase: '',
        category: 'تيشرتات',
        images: [],
        stock: '10',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        customSizes: '',
        availableColors: ['أسود', 'أبيض', 'كحلي', 'بيج', 'زيتي'],
        customColors: ''
      });
      alert(lang === 'ar' ? 'تمت إضافة قطعة الملابس بنجاح!' : 'Product added successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج نهائياً من المتجر؟' : 'Are you sure you want to delete this product?')) return;
    try {
      await apiRequest(`/api/products/${productId}`, { method: 'DELETE', adminPassword });
      mutateProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this order?')) return;
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE', adminPassword });
      mutateOrders();
    } catch (err) {
      alert(err.message);
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

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (changePassForm.newPass !== changePassForm.confirmPass) {
      setPassMessage({ text: lang === 'ar' ? 'كلمات المرور الجديدة غير متطابقة!' : 'New passwords do not match!', type: 'error' });
      return;
    }

    try {
      await apiRequest('/api/admin/login', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: changePassForm.currentPass,
          newPassword: changePassForm.newPass
        })
      });

      setAdminPassword(changePassForm.newPass);
      setPassMessage({ text: lang === 'ar' ? 'تم حفظ كلمة المرور الجديدة بنجاح! 🔒' : 'Password updated successfully! 🔒', type: 'success' });
      setChangePassForm({ currentPass: '', newPass: '', confirmPass: '' });
    } catch (err) {
      setPassMessage({ text: err.message, type: 'error' });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword('');
    setShowSettings(false);
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

  const isRtl = lang === 'ar';

  const countTotalOrders = orders.length;
  const countNewOrders = orders.filter(o => (o?.status || 'جديد') === 'جديد').length;
  const countShippingOrders = orders.filter(o => o?.status === 'جاري الشحن').length;
  const countDeliveredOrders = orders.filter(o => o?.status === 'تم التسليم').length;
  const countCancelledOrders = orders.filter(o => o?.status === 'ملغي').length;
  const totalSalesAmount = orders
    .filter(o => o?.status === 'تم التسليم')
    .reduce((sum, o) => sum + (Number(o?.total) || 0), 0);

  return (
    <div style={{
      fontFamily: 'Cairo, sans-serif',
      backgroundColor: '#FFFFFF',
      color: '#111827',
      minHeight: '100vh',
      direction: isRtl ? 'rtl' : 'ltr',
      textAlign: isRtl ? 'right' : 'left',
    }}>
      <header style={styles.header}>
        <div style={styles.topBanner}>{t.topBanner}</div>
        <nav style={styles.navBar}>
          <div style={styles.brandLogo} onClick={() => { setActiveTab('shop'); setOrderSuccess(false); }}>
            <span style={{ fontSize: '1.6rem' }}>🛍️</span>
            <div>
              {t.storeName}
              <span style={styles.logoSub}>FASHION STORE CASUAL</span>
            </div>
          </div>

          <div style={styles.navLinks}>
            <button 
              style={{
                ...styles.navBtn,
                fontWeight: activeTab === 'shop' ? 'bold' : 'normal',
                borderBottom: activeTab === 'shop' ? '2px solid #111827' : '2px solid transparent'
              }}
              onClick={() => { setActiveTab('shop'); setOrderSuccess(false); }}
            >
              {t.navHome}
            </button>
            <button style={styles.navBtn} onClick={() => {
              const el = document.getElementById('contact-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              {t.navContact}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', border: '1px solid #D1D5DB', borderRadius: '20px', overflow: 'hidden' }}>
              <button
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  backgroundColor: lang === 'ar' ? '#111827' : '#FFFFFF',
                  color: lang === 'ar' ? '#FFFFFF' : '#374151',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
                onClick={() => toggleLanguage('ar')}
              >
                العربية
              </button>
              <button
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  backgroundColor: lang === 'en' ? '#111827' : '#FFFFFF',
                  color: lang === 'en' ? '#FFFFFF' : '#374151',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
                onClick={() => toggleLanguage('en')}
              >
                EN
              </button>
            </div>

            <div 
              style={{
                ...styles.cartIconContainer,
                transform: cartAnimate ? 'scale(1.25) rotate(-10deg)' : 'scale(1)',
                transition: 'transform 0.3s ease-in-out'
              }} 
              onClick={() => { setActiveTab('cart'); setOrderSuccess(false); }}
            >
              <span style={styles.cartIcon}>🛍️</span>
              <span style={{
                ...styles.cartBadge,
                backgroundColor: cartAnimate ? '#059669' : '#111827',
                transform: cartAnimate ? 'scale(1.3)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}>
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            </div>
          </div>
        </nav>
      </header>

      {activeTab === 'shop' && (
        <main style={{ minHeight: '80vh' }}>
          <section style={styles.heroSection}>
            <div style={styles.heroTextContainer}>
              <h1 style={styles.heroTitle}>{t.heroTitle}</h1>
              <p style={styles.heroSubtitle}>{t.heroSub}</p>
              <div style={styles.heroButtons}>
                <button style={styles.primaryBtn} onClick={() => {
                  const el = document.getElementById('products-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>{t.shopNow}</button>
              </div>
            </div>

            <div style={styles.heroImageCard}>
              <img src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80" alt="Casual Collection" style={styles.heroImg} />
            </div>
          </section>

          <section id="products-grid" style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f9fafb' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '10px' }}>{t.sectionTitle}</h2>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '20px' }}>{t.sectionSub}</p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {['الكل', 'تيشرتات', 'بنطلونات', 'هوديز وسويت شيرت', 'جاكيتات'].map(cat => (
                  <button
                    key={cat}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      backgroundColor: selectedCategory === cat ? '#111827' : '#FFFFFF',
                      color: selectedCategory === cat ? '#FFFFFF' : '#374151',
                      border: selectedCategory === cat ? '1px solid #111827' : '1px solid #D1D5DB',
                    }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'الكل' ? t.all : cat === 'تيشرتات' ? t.tshirts : cat === 'بنطلونات' ? t.pants : cat === 'هوديز وسويت شيرت' ? t.hoodies : t.jackets}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
              {(selectedCategory === 'الكل' ? products : products.filter(p => p.category === selectedCategory)).map(product => {
                const isOutOfStock = product.stock <= 0;
                const productImgs = parseProductImages(product);
                const activeImg = selectedImages[product.id] || productImgs[0] || '';

                const availSizes = parseProductList(product.available_sizes || product.availableSizes, ALL_SIZES);
                const availColors = parseProductList(product.available_colors || product.availableColors, ALL_COLORS);

                const currentOpts = productOptions[product.id] || {
                  size: availSizes[0] || 'M',
                  color: availColors[0] || 'أسود'
                };

                const isAdded = buttonFeedback[product.id];
                const priceVal = product.priceBase || product.price_base;

                return (
                  <div key={product.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: '280px' }}>
                      <img src={activeImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isOutOfStock && <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#EF4444', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>{t.outOfStock}</span>}
                    </div>

                    {productImgs.length > 1 && (
                      <div style={{ display: 'flex', gap: '6px', padding: '10px 15px 0 15px', overflowX: 'auto' }}>
                        {productImgs.map((imgUrl, idx) => (
                          <img
                            key={idx}
                            src={imgUrl}
                            alt="thumb"
                            style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: activeImg === imgUrl ? '2px solid #111827' : '1px solid #D1D5DB' }}
                            onClick={() => setSelectedImages(prev => ({ ...prev, [product.id]: imgUrl }))}
                          />
                        ))}
                      </div>
                    )}

                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '5px' }}>{product.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '15px' }}>{product.subtitle}</p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#374151', fontWeight: '600' }}>{t.size}:</label>
                          <select style={styles.selectInput} value={currentOpts.size} onChange={(e) => handleOptionChange(product.id, 'size', e.target.value)} disabled={isOutOfStock}>
                            {availSizes.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#374151', fontWeight: '600' }}>{t.color}:</label>
                          <select style={styles.selectInput} value={currentOpts.color} onChange={(e) => handleOptionChange(product.id, 'color', e.target.value)} disabled={isOutOfStock}>
                            {availColors.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #F3F4F6' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px' }}>{priceVal} EGP</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            style={{
                              ...styles.addCartBtn,
                              flex: 1,
                              backgroundColor: isOutOfStock ? '#9CA3AF' : isAdded ? '#059669' : '#111827',
                              transform: isAdded ? 'scale(1.05)' : 'scale(1)',
                              transition: 'all 0.2s ease-in-out'
                            }}
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock}
                          >
                            {isOutOfStock ? t.outOfStock : isAdded ? t.addedToCart : t.addToCart}
                          </button>
                          <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: isOutOfStock ? '#9CA3AF' : '#059669', color: '#fff', fontWeight: 'bold', cursor: isOutOfStock ? 'not-allowed' : 'pointer' }} onClick={() => { if (!isOutOfStock) { addToCart(product); setActiveTab('cart'); } }} disabled={isOutOfStock}>
                            {t.buyNow}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer id="contact-section" style={{ backgroundColor: '#111827', color: '#FFFFFF', padding: '50px 20px 20px 20px', marginTop: '60px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', marginBottom: '40px' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{t.storeName}</h3>
                <p style={{ color: '#9CA3AF', fontSize: '0.95rem', lineHeight: '1.6' }}>{t.footerDesc}</p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{t.footerContact}</h4>
                <p style={{ color: '#9CA3AF' }}>{t.footerEmail} contact@fashionstore.com</p>
                <p style={{ color: '#9CA3AF' }}>{t.footerPhone} 01147554038</p>
              </div>
            </div>
            <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#6B7280' }}>
              <span onClick={handleSecretAdminTrigger} style={{ cursor: 'pointer' }}>🛍️ </span>
              {t.footerRights}
            </div>
          </footer>
        </main>
      )}

      {activeTab === 'cart' && (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center' }}>{t.cartTitle}</h2>
          {orderSuccess ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #A7F3D0', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ color: '#059669', marginBottom: '10px' }}>{t.orderSuccess}</h3>
              <p>{t.orderSuccessSub}</p>
              {lastOrderId && <p style={{ marginTop: '8px' }}>{t.orderId} <strong>{lastOrderId}</strong></p>}
              <button style={{ ...styles.primaryBtn, marginTop: '20px' }} onClick={() => { setOrderSuccess(false); setActiveTab('shop'); }}>{t.continueShopping}</button>
            </div>
          ) : cart.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
              <p style={{ marginBottom: '20px' }}>{t.cartEmpty}</p>
              <button style={styles.primaryBtn} onClick={() => setActiveTab('shop')}>{t.browseClothes}</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {cart.map(item => (
                  <div key={item.cartKey} style={{ backgroundColor: '#FFFFFF', padding: '15px', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={item.image} alt={item.name} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <h4>{item.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>{t.size}: {item.size} | {t.color}: {item.color}</p>
                      <span style={{ fontWeight: 'bold' }}>{item.price} EGP</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F9FAFB', padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                      <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => updateQty(item.cartKey, -1)}>-</button>
                      <span style={{ fontWeight: 'bold' }}>{item.qty}</span>
                      <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => updateQty(item.cartKey, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '12px', border: '1px solid #E5E7EB', height: 'fit-content' }}>
                <h3 style={{ marginBottom: '20px' }}>{t.shippingDetails}</h3>
                <form onSubmit={handleCheckoutSubmit}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.fullName}</label>
                    <input type="text" style={styles.formInput} value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} required />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.phone}</label>
                    <input type="text" style={styles.formInput} value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} required />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.address}</label>
                    <textarea style={{ ...styles.formInput, minHeight: '80px' }} value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} required />
                  </div>

                  <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>{t.subtotal}</span><span>{cartTotal} EGP</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>{t.shippingFee}</span><span>{deliveryFee === 0 ? t.free : `${deliveryFee} EGP`}</span></div>
                  <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}><span>{t.total}</span><span>{grandTotal} EGP</span></div>

                  {orderError && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '10px' }}>{orderError}</p>}

                  <button
                    type="submit"
                    style={{
                      ...styles.primaryBtn,
                      width: '100%',
                      marginTop: '20px',
                      backgroundColor: isSubmittingOrder ? '#9CA3AF' : '#059669',
                      cursor: isSubmittingOrder ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isSubmittingOrder}
                  >
                    {isSubmittingOrder ? t.submittingOrder : t.confirmOrder}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'admin' && (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
          {!isAuthenticated ? (
            <div style={{ maxWidth: '400px', margin: '60px auto', backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔒</div>
              <h2 style={{ marginBottom: '10px', color: '#111827' }}>{t.loginTitle}</h2>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '20px' }}>{t.loginSub}</p>
              <form onSubmit={handleAdminLogin}>
                <div style={{ marginBottom: '15px', textAlign: isRtl ? 'right' : 'left' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{t.passwordLabel}</label>
                  <input type="password" style={styles.formInput} value={enteredPassword} onChange={(e) => setEnteredPassword(e.target.value)} required />
                </div>
                {passwordError && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '15px' }}>{passwordError}</p>}
                <button type="submit" style={{ ...styles.primaryBtn, width: '100%', borderRadius: '8px' }}>{t.loginBtn}</button>
              </form>
              <button style={{ ...styles.primaryBtn, width: '100%', marginTop: '10px', backgroundColor: 'transparent', color: '#111827', border: '1px solid #111827' }} onClick={() => setActiveTab('shop')}>{t.backToStore}</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{t.adminTitle}</h2>
                  <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>{t.adminSub}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #111827', backgroundColor: showSettings ? '#111827' : 'transparent', color: showSettings ? '#FFF' : '#111827', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setShowSettings(!showSettings)}>
                    {t.settingsBtn}
                  </button>
                  <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #111827', backgroundColor: 'transparent', cursor: 'pointer' }} onClick={handleLogout}>
                    {t.logoutBtn}
                  </button>
                </div>
              </div>

              {/* نافذة الإعدادات والتنبيه */}
              {showSettings && (
                <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #D1D5DB', padding: '25px', borderRadius: '12px', marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#111827' }}>{t.changePasswordTitle}</h3>
                  <form onSubmit={handleChangePasswordSubmit} style={{ maxWidth: '500px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.currentPasswordLabel}</label>
                      <input type="password" style={styles.formInput} value={changePassForm.currentPass} onChange={e => setChangePassForm({...changePassForm, currentPass: e.target.value})} required />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.newPasswordLabel}</label>
                      <input type="password" style={styles.formInput} value={changePassForm.newPass} onChange={e => setChangePassForm({...changePassForm, newPass: e.target.value})} required />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.confirmNewPasswordLabel}</label>
                      <input type="password" style={styles.formInput} value={changePassForm.confirmPass} onChange={e => setChangePassForm({...changePassForm, confirmPass: e.target.value})} required />
                    </div>

                    {passMessage.text && (
                      <div style={{ backgroundColor: passMessage.type === 'error' ? '#FEE2E2' : '#D1FAE5', color: passMessage.type === 'error' ? '#991B1B' : '#065F46', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px', lineHeight: '1.5' }}>
                        {passMessage.text}
                      </div>
                    )}

                    <button type="submit" style={{ ...styles.primaryBtn, backgroundColor: '#059669', padding: '10px 20px' }}>
                      {t.savePasswordBtn}
                    </button>
                  </form>
                </div>
              )}

              {/* الداشبورد بالإحصائيات */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <div style={{ backgroundColor: '#111827', color: '#FFFFFF', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{t.statTotalSales}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '5px' }}>{totalSalesAmount} EGP</div>
                </div>
                <div style={{ backgroundColor: '#F3F4F6', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{t.statTotalOrders}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#111827', marginTop: '5px' }}>{countTotalOrders}</div>
                </div>
                <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.85rem' }}>{t.statNewOrders}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '5px' }}>{countNewOrders}</div>
                </div>
                <div style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '0.85rem' }}>{t.statShippingOrders}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '5px' }}>{countShippingOrders}</div>
                </div>
                <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '0.85rem' }}>{t.statDeliveredOrders}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '5px' }}>{countDeliveredOrders}</div>
                </div>
                <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #FCA5A5' }}>
                  <div style={{ fontSize: '0.85rem' }}>{t.statCancelledOrders}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '5px' }}>{countCancelledOrders}</div>
                </div>
              </div>

              {/* إضافة قطعة جديدة */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <h3 style={{ marginBottom: '15px', color: '#111827' }}>{t.addNewProduct}</h3>
                <form onSubmit={handleAddProductSubmit} style={{ backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.productName}</label>
                      <input type="text" style={styles.formInput} value={newProductForm.name} onChange={e => setNewProductForm({...newProductForm, name: e.target.value})} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.subtitle}</label>
                      <input type="text" style={styles.formInput} value={newProductForm.subtitle} onChange={e => setNewProductForm({...newProductForm, subtitle: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.price}</label>
                      <input type="number" style={styles.formInput} value={newProductForm.priceBase} onChange={e => setNewProductForm({...newProductForm, priceBase: e.target.value})} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.category}</label>
                      <select style={styles.selectInput} value={newProductForm.category} onChange={e => setNewProductForm({...newProductForm, category: e.target.value})}>
                        <option value="تيشرتات">تيشرتات / T-Shirts</option>
                        <option value="بنطلونات">بنطلونات / Pants</option>
                        <option value="هوديز وسويت شيرت">هوديز / Hoodies</option>
                        <option value="جاكيتات">جاكيتات / Jackets</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.stockQty}</label>
                      <input type="number" style={styles.formInput} value={newProductForm.stock} onChange={e => setNewProductForm({...newProductForm, stock: e.target.value})} required />
                    </div>
                  </div>

                  <div style={{ marginTop: '15px', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{t.selectSizes}</label>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {ALL_SIZES.map(s => (
                        <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newProductForm.availableSizes.includes(s)}
                            onChange={() => handleCheckboxChange('availableSizes', s)}
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>{t.customSizesLabel}</label>
                      <input
                        type="text"
                        style={styles.formInput}
                        value={newProductForm.customSizes}
                        onChange={e => setNewProductForm({...newProductForm, customSizes: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '15px', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{t.selectColors}</label>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {ALL_COLORS.map(c => (
                        <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newProductForm.availableColors.includes(c)}
                            onChange={() => handleCheckboxChange('availableColors', c)}
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>{t.customColorsLabel}</label>
                      <input
                        type="text"
                        style={styles.formInput}
                        value={newProductForm.customColors}
                        onChange={e => setNewProductForm({...newProductForm, customColors: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.productImages}</label>
                    <input type="file" accept="image/*" multiple onChange={handleMultipleImagesUpload} style={{ ...styles.formInput, padding: '6px' }} />
                  </div>

                  {newProductForm.images.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 'bold' }}>{newProductForm.images.length} images selected ✓</span>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {newProductForm.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`Preview ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" style={{ ...styles.primaryBtn, marginTop: '20px', padding: '10px 25px' }}>{t.submitProduct}</button>
                </form>
              </div>

              {/* قسم عرض المنتجات الحالية وإدارتها (حذف / تعديل) */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '12px', border: '1px solid #E5E7EB', marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#111827' }}>{t.currentProducts}</h3>
                {products.length === 0 ? (
                  <p style={{ color: '#6B7280' }}>{t.noProducts}</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E5E7EB', textAlign: isRtl ? 'right' : 'left' }}>
                          <th style={{ padding: '10px' }}>{t.tableImages}</th>
                          <th style={{ padding: '10px' }}>{t.tableName}</th>
                          <th style={{ padding: '10px' }}>{t.tableCategory}</th>
                          <th style={{ padding: '10px' }}>{t.tablePrice}</th>
                          <th style={{ padding: '10px' }}>{t.tableStock}</th>
                          <th style={{ padding: '10px' }}>{t.tableSizes}</th>
                          <th style={{ padding: '10px' }}>{t.tableColors}</th>
                          <th style={{ padding: '10px' }}>{t.tableActions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(prod => {
                          const prodImgs = parseProductImages(prod);
                          const prodSizes = parseProductList(prod.available_sizes || prod.availableSizes, ALL_SIZES);
                          const prodColors = parseProductList(prod.available_colors || prod.availableColors, ALL_COLORS);
                          const price = prod.priceBase || prod.price_base;

                          return (
                            <tr key={prod.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                              <td style={{ padding: '10px' }}>
                                <img src={prodImgs[0] || ''} alt={prod.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                              </td>
                              <td style={{ padding: '10px' }}>
                                <strong>{prod.name}</strong>
                                {prod.subtitle && <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{prod.subtitle}</div>}
                              </td>
                              <td style={{ padding: '10px' }}>{prod.category}</td>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{price} EGP</td>
                              <td style={{ padding: '10px' }}>{prod.stock}</td>
                              <td style={{ padding: '10px', maxWidth: '120px' }}>{prodSizes.join(', ')}</td>
                              <td style={{ padding: '10px', maxWidth: '120px' }}>{prodColors.join(', ')}</td>
                              <td style={{ padding: '10px' }}>
                                <button
                                  style={{ padding: '6px 12px', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                  onClick={() => handleDeleteProduct(prod.id)}
                                >
                                  {t.deleteBtn}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* سجل الطلبات والشحن */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '12px', border: '1px solid #E5E7EB', marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#111827' }}>{t.orderLog}</h3>
                {orders.length === 0 ? (
                  <p style={{ color: '#6B7280' }}>{t.noOrders}</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E5E7EB', textAlign: isRtl ? 'right' : 'left' }}>
                          <th style={{ padding: '10px' }}>{t.tableOrderId}</th>
                          <th style={{ padding: '10px' }}>{t.tableDate}</th>
                          <th style={{ padding: '10px' }}>{t.tableCustomer}</th>
                          <th style={{ padding: '10px' }}>{t.tablePhone}</th>
                          <th style={{ padding: '10px' }}>{t.tableAddress}</th>
                          <th style={{ padding: '10px' }}>{t.tableItems}</th>
                          <th style={{ padding: '10px' }}>{t.tableTotal}</th>
                          <th style={{ padding: '10px' }}>{t.tableStatus}</th>
                          <th style={{ padding: '10px' }}>{t.tableActions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o?.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '10px' }}><strong>{o?.id}</strong></td>
                            <td style={{ padding: '10px' }}>{formatOrderDate(o?.created_at)}</td>
                            <td style={{ padding: '10px' }}>{o?.customer_name}</td>
                            <td style={{ padding: '10px' }}>
                              <a href={`https://wa.me/20${o?.customer_phone?.replace(/^0+/, '')}`} target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 'bold' }}>
                                {o?.customer_phone}
                              </a>
                            </td>
                            <td style={{ padding: '10px', maxWidth: '150px' }}>{o?.shipping_address}</td>
                            <td style={{ padding: '10px' }}>
                              {Array.isArray(o?.items) ? o.items.map((item, idx) => (
                                <div key={idx}>• {item.name || 'Item'} ({item.size} / {item.color}) × {item.qty}</div>
                              )) : 'Details N/A'}
                            </td>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{o?.total} EGP</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: o?.status === 'تم التسليم' ? '#D1FAE5' : o?.status === 'جاري الشحن' ? '#DBEAFE' : o?.status === 'ملغي' ? '#FEE2E2' : '#FEF3C7', color: o?.status === 'تم التسليم' ? '#065F46' : o?.status === 'جاري الشحن' ? '#1E40AF' : o?.status === 'ملغي' ? '#991B1B' : '#92400E' }}>
                                {o?.status || 'جديد'}
                              </span>
                            </td>
                            <td style={{ padding: '10px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <select style={{ padding: '4px', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '0.8rem' }} value={o?.status || 'جديد'} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                                  <option value="جديد">جديد / New</option>
                                  <option value="جاري الشحن">جاري الشحن / Shipping</option>
                                  <option value="تم التسليم">تم التسليم / Delivered</option>
                                  <option value="ملغي">ملغي / Cancelled</option>
                                </select>
                                <button style={{ padding: '3px 6px', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => handleDeleteOrder(o.id)}>{t.deleteBtn}</button>
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
  header: { backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 100 },
  topBanner: { backgroundColor: '#111827', color: '#F9FAFB', textAlign: 'center', padding: '8px', fontSize: '0.85rem' },
  navBar: { maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brandLogo: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' },
  logoSub: { display: 'block', fontSize: '0.65rem', color: '#6B7280', letterSpacing: '1px' },
  navLinks: { display: 'flex', gap: '20px' },
  navBtn: { background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#111827' },
  cartIconContainer: { position: 'relative', cursor: 'pointer', backgroundColor: '#F3F4F6', padding: '8px 12px', borderRadius: '50%', display: 'flex' },
  cartIcon: { fontSize: '1.2rem' },
  cartBadge: { position: 'absolute', top: '-5px', right: '-5px', color: '#FFFFFF', fontSize: '0.75rem', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  heroSection: { maxWidth: '1200px', margin: '0 auto', padding: '60px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' },
  heroTextContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  heroTitle: { fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1.2' },
  heroSubtitle: { fontSize: '1.05rem', color: '#4B5563', lineHeight: '1.6' },
  heroButtons: { display: 'flex', gap: '15px' },
  primaryBtn: { backgroundColor: '#111827', color: '#FFFFFF', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  heroImageCard: { borderRadius: '16px', overflow: 'hidden' },
  heroImg: { width: '100%', height: '400px', objectFit: 'cover' },
  selectInput: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', fontSize: '0.85rem', outline: 'none' },
  addCartBtn: { padding: '10px', borderRadius: '8px', border: 'none', color: '#FFFFFF', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' },
  formInput: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', fontSize: '0.9rem', outline: 'none' },
};

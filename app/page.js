'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import menuData from '@/data/menu.json';
import { motion, AnimatePresence } from 'framer-motion';

// Language configuration
const languages = {
  en: { code: 'en', name: 'English', dir: 'ltr' },
  ar: { code: 'ar', name: 'العربية', dir: 'rtl' }
};

// Helper function to format prices (handles arrays, null, and numbers)
const formatPrice = (price, language = 'ar') => {
  if (price === null || price === undefined || price === '') {
    return language === 'en' ? 'Price on request' : 'السعر عند الطلب';
  }

  if (Array.isArray(price)) {
    if (price.length === 0) {
      return language === 'en' ? 'Price on request' : 'السعر عند الطلب';
    }

    // For arrays, show range or multiple prices
    const minPrice = Math.min(...price);
    const maxPrice = Math.max(...price);

    if (minPrice === maxPrice) {
      return `EGP ${minPrice}`;
    } else {
      return language === 'en'
        ? `EGP ${minPrice} - ${maxPrice}`
        : `ج.م ${minPrice} - ${maxPrice}`;
    }
  }

  return `EGP ${price}`;
};

// Helper function to get text based on language
const getText = (item, field, language) => {
  if (!item) return '';

  if (language === 'ar') {
    return item[`${field}_ar`] || item[field] || '';
  }
  return item[field] || '';
};

// Color system with proper contrast
const colors = {
  primary: '#4EA595',
  secondary: '#EB4B36',
  accent: '#FBF4DB',
  white: '#FFFFFF',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(menuData)[0] || 'trays');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceSort, setPriceSort] = useState('default');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [visibleItems, setVisibleItems] = useState(8);
  const [imageLoadStates, setImageLoadStates] = useState({});
  const [language, setLanguage] = useState('ar'); // Arabic as default

  const categoriesRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const observerRef = useRef(null);

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = languages[language]?.dir || 'rtl';
    document.documentElement.lang = language;
  }, [language]);

  // Sticky navigation effect
  useEffect(() => {
    const handleScroll = () => {
      if (categoriesRef.current) {
        const rect = categoriesRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset visible items when category or search changes
  useEffect(() => {
    setVisibleItems(8);
  }, [selectedCategory, searchQuery]);

  // Close modals on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isItemModalOpen) setIsItemModalOpen(false);
        if (isCartOpen) setIsCartOpen(false);
      }
    };

    if (isItemModalOpen || isCartOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isItemModalOpen, isCartOpen]);

  // Category scroll functions - Fixed for RTL
  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;

      // For RTL languages, flip the scroll direction
      let actualDirection = direction;
      if (language === 'ar') {
        actualDirection = direction === 'left' ? 'right' : 'left';
      }

      categoryScrollRef.current.scrollBy({
        left: actualDirection === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Filter and sort items
  const getFilteredAndSortedItems = useCallback(() => {
    const categoryData = menuData[selectedCategory];
    if (!categoryData || !categoryData.items) return [];

    let items = [...categoryData.items];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        (item.name_ar && item.name_ar.includes(searchQuery)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.description_ar && item.description_ar.includes(searchQuery))
      );
    }

    if (priceSort === 'low-high') {
      items = items.sort((a, b) => {
        const priceA = Array.isArray(a.price) ? Math.min(...a.price) : (a.price || 0);
        const priceB = Array.isArray(b.price) ? Math.min(...b.price) : (b.price || 0);
        return priceA - priceB;
      });
    } else if (priceSort === 'high-low') {
      items = items.sort((a, b) => {
        const priceA = Array.isArray(a.price) ? Math.max(...a.price) : (a.price || 0);
        const priceB = Array.isArray(b.price) ? Math.max(...b.price) : (b.price || 0);
        return priceB - priceA;
      });
    }

    return items;
  }, [selectedCategory, searchQuery, priceSort]);

  const filteredItems = getFilteredAndSortedItems();
  const displayedItems = filteredItems.slice(0, visibleItems);

  // Cart functions
  const addToCart = (item, quantity = 1) => {
    if (!item) return;

    // For items with price arrays, use the first price
    const cartPrice = Array.isArray(item.price) ? item.price[0] : (item.price || 0);

    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.name === item.name);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.name === item.name
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      return [...prev, { ...item, price: cartPrice, quantity }];
    });
  };

  const updateQuantity = (itemName, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemName);
      return;
    }
    setCart(prev => prev.map(item =>
      item.name === itemName ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (itemName) => {
    setCart(prev => prev.filter(item => item.name !== itemName));
  };

  const clearCart = () => {
    setCart([]);
    setOrderNotes('');
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

  // WhatsApp order function
  const handleWhatsAppOrder = () => {
    const whatsappNumber = "+201000000000"; // Egyptian number
    let message = language === 'en'
      ? "Hello! I'd like to place an order from Matbakh Gedity.\n\n"
      : "مرحباً! أود تقديم طلب من مطبخ جديتي.\n\n";

    cart.forEach(item => {
      const itemName = language === 'ar' && item.name_ar ? item.name_ar : item.name;
      message += `• ${item.quantity}x ${itemName} - EGP ${(item.price || 0) * (item.quantity || 0)}\n`;
    });

    message += `\n${language === 'en' ? 'Total' : 'المجموع'}: EGP ${getTotalPrice()}`;

    if (orderNotes) {
      message += `\n\n${language === 'en' ? 'Special Instructions' : 'تعليمات خاصة'}: ${orderNotes}`;
    }

    message += `\n\n${language === 'en' ? 'Thank you!' : 'شكراً!'}`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Function to open item modal
  const handleItemClick = (item) => {
    if (!item) return;
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  // Image load handler
  const handleImageLoad = (itemName) => {
    setImageLoadStates(prev => ({ ...prev, [itemName]: true }));
  };

  const cardVariants = {
    hidden: {
      y: 20,
      opacity: 0,
      scale: 0.8
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <Layout>
      {/* Language Switcher - Relative positioning below logo */}
      <div style={languageSwitcherStyles}>
        <button
          onClick={() => setLanguage('en')}
          style={{
            ...languageButtonStyles,
            ...(language === 'en' ? activeLanguageButtonStyles : {})
          }}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('ar')}
          style={{
            ...languageButtonStyles,
            ...(language === 'ar' ? activeLanguageButtonStyles : {})
          }}
        >
          ع
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div style={searchContainerStyles}>
        <div style={searchBarStyles}>
          <input
            type="text"
            placeholder={language === 'en' ? "Search dishes..." : "ابحث في الأطباق..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyles}
          />
          <svg style={searchIconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Custom Dropdown */}
        <div style={customDropdownStyles}>
          <select
            value={priceSort}
            onChange={(e) => setPriceSort(e.target.value)}
            style={customSelectStyles}
          >
            <option value="default">{language === 'en' ? 'Sort by Price' : 'ترتيب حسب السعر'}</option>
            <option value="low-high">{language === 'en' ? 'Price: Low to High' : 'السعر: من الأقل للأعلى'}</option>
            <option value="high-low">{language === 'en' ? 'Price: High to Low' : 'السعر: من الأعلى للأقل'}</option>
          </select>
          <div style={dropdownArrowStyles}>▼</div>
        </div>
      </div>

      {/* Sticky Categories Navigation with Scroll Buttons */}
      <div
        ref={categoriesRef}
        className={`sticky-categories ${isSticky ? 'sticky' : ''}`}
        style={stickyContainerStyles}
      >
        {/* Scroll buttons - arrows will flip direction in Arabic */}
        <button
          onClick={() => scrollCategories('left')}
          style={scrollButtonStyles}
          className="scroll-btn left"
        >
          {language === 'ar' ? '›' : '‹'}
        </button>

        <div ref={categoryScrollRef} style={categoryListStyles}>
          {Object.keys(menuData).map((categoryId) => (
            <button
              key={categoryId}
              style={{
                ...categoryButtonStyles,
                ...(selectedCategory === categoryId ? selectedCategoryStyle : {})
              }}
              onClick={() => setSelectedCategory(categoryId)}
              className="category-btn"
            >
              {getText(menuData[categoryId], 'name', language)}
            </button>
          ))}
        </div>

        <button
          onClick={() => scrollCategories('right')}
          style={scrollButtonStyles}
          className="scroll-btn right"
        >
          {language === 'ar' ? '‹' : '›'}
        </button>
      </div>

      {/* Rest of your component remains the same... */}
      {/* Main Content */}
      <div style={contentStyles}>
        {/* Menu Items Grid */}
        <motion.div
          style={gridStyles}
          key={selectedCategory + searchQuery + priceSort}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {displayedItems.map((item, index) => {
            if (!item) return null;

            return (
              <motion.div
                key={item.name || index}
                style={gridItemStyles}
                className="menu-item-card"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                onClick={() => handleItemClick(item)}
              >
                {/* Image with loading state */}
                {item.image && (
                  <div style={imageContainerStyles}>
                    {!imageLoadStates[item.name] && (
                      <div style={skeletonStyles}></div>
                    )}
                    <img
                      src={`/images/${selectedCategory}/${item.image}`}
                      alt={getText(item, 'name', language)}
                      style={{
                        ...imageStyles,
                        display: imageLoadStates[item.name] ? 'block' : 'none'
                      }}
                      onLoad={() => handleImageLoad(item.name)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        handleImageLoad(item.name);
                      }}
                    />
                  </div>
                )}

                <div style={contentContainerStyles}>
                  <div style={titleContainerStyles}>
                    <h3 style={{
                      ...itemNameStyles,
                      textAlign: language === 'ar' ? 'right' : 'left',
                      direction: language === 'ar' ? 'rtl' : 'ltr'
                    }}>
                      {getText(item, 'name', language)}
                    </h3>
                  </div>

                  <p style={{
                    ...itemDescriptionStyles,
                    textAlign: language === 'ar' ? 'right' : 'left',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                  }}>
                    {getText(item, 'description', language)}
                  </p>

                  <div style={priceCartContainerStyles}>
                    <p style={priceStyles}>
                      {formatPrice(item.price, language)}
                    </p>

                    <div style={quantitySelectorStyles}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const cartItem = cart.find(ci => ci.name === item.name);
                          if (cartItem) {
                            updateQuantity(item.name, cartItem.quantity - 1);
                          }
                        }}
                        style={quantityButtonStyles}
                      >
                        -
                      </button>
                      <span style={quantityDisplayStyles}>
                        {cart.find(ci => ci.name === item.name)?.quantity || 0}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        style={quantityButtonStyles}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* No results message */}
        {displayedItems.length === 0 && (
          <div style={noResultsStyles}>
            <p>{language === 'en' ? 'No dishes found matching your search.' : 'لم يتم العثور على أطباق تطابق بحثك.'}</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <motion.button
          onClick={() => setIsCartOpen(true)}
          style={floatingCartButtonStyles}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="floating-cart-btn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
          <span style={cartBadgeStyles}>{getTotalItems()}</span>
        </motion.button>
      )}

      {/* Floating WhatsApp Button */}
      {getTotalItems() > 0 && (
        <motion.button
          onClick={handleWhatsAppOrder}
          style={floatingWhatsAppButtonStyles}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="floating-whatsapp-btn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.169-3.495-8.418" />
          </svg>
        </motion.button>
      )}

      {/* Order Summary Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Glass-like Backdrop */}
            <motion.div
              className="absolute inset-0 backdrop-blur-md bg-white bg-opacity-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto max-w-2xl w-full mx-auto border-2 bg-white border-gray-200"
              initial={{
                scale: 0.7,
                opacity: 0,
                rotateX: -15
              }}
              animate={{
                scale: 1,
                opacity: 1,
                rotateX: 0
              }}
              exit={{
                scale: 0.7,
                opacity: 0,
                rotateX: 15
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
            >
              {/* Close Button with more space */}
              <motion.button
                onClick={() => setIsCartOpen(false)}
                className="absolute top-8 right-8 rounded-full p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Cart Content */}
              <div style={cartModalContentStyles}>
                <div style={cartHeaderStyles}>
                  <motion.h2
                    style={cartTitleStyles}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {language === 'en' ? 'Your Order' : 'طلبك'}
                  </motion.h2>

                  {cart.length > 0 && (
                    <motion.button
                      onClick={clearCart}
                      style={clearCartButtonStyles}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {language === 'en' ? 'Clear All' : 'مسح الكل'}
                    </motion.button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <p style={emptyCartStyles}>
                    {language === 'en' ? 'Your cart is empty' : 'سلة التسوق فارغة'}
                  </p>
                ) : (
                  <>
                    <div style={cartItemsContainerStyles}>
                      {cart.map((item, index) => (
                        <motion.div
                          key={item.name}
                          style={cartItemContainerStyles}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <div style={cartItemContentStyles}>
                            <div style={cartItemHeaderStyles}>
                              <h4 style={cartItemNameStyles}>
                                {language === 'ar' && item.name_ar ? item.name_ar : item.name}
                              </h4>
                              <button
                                onClick={() => removeFromCart(item.name)}
                                style={cartRemoveButtonStyles}
                              >
                                ×
                              </button>
                            </div>
                            <div style={cartItemDetailsStyles}>
                              <span style={cartItemPriceStyles}>
                                {language === 'en' ? 'EGP' : 'ج.م'} {item.price} {language === 'en' ? 'each' : 'للقطعة'}
                              </span>
                              <div style={cartItemControlsStyles}>
                                <button
                                  onClick={() => updateQuantity(item.name, item.quantity - 1)}
                                  style={cartQuantityButtonStyles}
                                >
                                  −
                                </button>
                                <span style={cartQuantityStyles}>{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.name, item.quantity + 1)}
                                  style={cartQuantityButtonStyles}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div style={cartItemTotalStyles}>
                              {language === 'en' ? 'Total' : 'المجموع'}: <strong>{language === 'en' ? 'EGP' : 'ج.م'} {(item.price || 0) * (item.quantity || 0)}</strong>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      style={orderNotesContainerStyles}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <label style={orderNotesLabelStyles}>
                        {language === 'en' ? 'Special Instructions:' : 'تعليمات خاصة:'}
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder={language === 'en'
                          ? "Any special requests or dietary requirements..."
                          : "أي طلبات خاصة أو متطلبات غذائية..."}
                        style={orderNotesInputStyles}
                        rows="3"
                      />
                    </motion.div>

                    <motion.div
                      style={cartTotalContainerStyles}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div style={cartTotalStyles}>
                        <span>{language === 'en' ? 'Total:' : 'المجموع الكلي:'}</span>
                        <strong style={cartTotalPriceStyles}>
                          {language === 'en' ? 'EGP' : 'ج.م'} {getTotalPrice()}
                        </strong>
                      </div>
                    </motion.div>

                    <motion.button
                      onClick={handleWhatsAppOrder}
                      style={checkoutButtonStyles}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {language === 'en' ? 'Send Order via WhatsApp' : 'إرسال الطلب عبر واتساب'}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {isItemModalOpen && selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Glass-like Backdrop */}
            <motion.div
              className="absolute inset-0 backdrop-blur-md bg-white bg-opacity-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsItemModalOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto max-w-2xl w-full mx-auto border-2 bg-white border-gray-200"
              initial={{
                scale: 0.7,
                opacity: 0,
                rotateX: -15
              }}
              animate={{
                scale: 1,
                opacity: 1,
                rotateX: 0
              }}
              exit={{
                scale: 0.7,
                opacity: 0,
                rotateX: 15
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
            >
              {/* Close Button */}
              <motion.button
                onClick={() => setIsItemModalOpen(false)}
                className="absolute top-6 right-6 rounded-full p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Item Content */}
              <div className="text-center">
                {selectedItem.image && (
                  <motion.img
                    src={`/images/${selectedCategory}/${selectedItem.image}`}
                    alt={getText(selectedItem, 'name', language)}
                    className="w-64 h-64 object-cover rounded-2xl mx-auto mb-6 border-2 border-gray-200"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <motion.h2
                  className="text-3xl font-bold mb-4 text-gray-900"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {getText(selectedItem, 'name', language)}
                </motion.h2>

                <motion.p
                  className="text-lg mb-6 text-gray-600"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {getText(selectedItem, 'description', language)}
                </motion.p>
                <motion.p
                  className="text-2xl font-bold mb-6 text-red-500"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {formatPrice(selectedItem.price, language)}
                </motion.p>

                <motion.button
                  onClick={() => {
                    addToCart(selectedItem);
                    setIsItemModalOpen(false);
                  }}
                  style={addToCartButtonStyles}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {language === 'en' ? 'Add to Cart' : 'أضف إلى السلة'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copyright Footer */}
      <footer style={footerStyles}>
        <div style={copyrightStyles}>
          © {new Date().getFullYear()} مطبخ جديتي. جميع الحقوق محفوظة.
          <br />
          <span style={developedByStyles}>Developed by esto</span>
        </div>
      </footer>
    </Layout>
  );
}

// ==================== STYLES ====================

const languageSwitcherStyles = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  gap: '0.5rem',
  backgroundColor: colors.white,
  padding: '0.75rem',
  borderRadius: '12px',
  border: `1px solid ${colors.gray[200]}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  margin: '1rem auto',
  width: 'fit-content'
};

const languageButtonStyles = {
  padding: '0.5rem 1rem',
  border: `1px solid ${colors.gray[300]}`,
  borderRadius: '8px',
  backgroundColor: colors.white,
  color: colors.gray[600],
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minWidth: '50px'
};

const activeLanguageButtonStyles = {
  backgroundColor: colors.primary,
  color: colors.white,
  border: `1px solid ${colors.primary}`
};

const searchContainerStyles = {
  display: 'flex',
  gap: '1rem',
  padding: '1rem',
  alignItems: 'center',
  flexWrap: 'wrap',
  backgroundColor: colors.white,
  marginTop: '0' // Removed the extra margin since language switcher is now in normal flow
};

const searchBarStyles = {
  position: 'relative',
  flex: 1,
  minWidth: '250px'
};

const searchInputStyles = {
  width: '100%',
  padding: '0.75rem 1rem 0.75rem 2.5rem',
  border: `2px solid ${colors.gray[200]}`,
  borderRadius: '12px',
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.3s ease',
  backgroundColor: colors.white,
  fontFamily: 'inherit',
  color: colors.gray[800],
};

const searchIconStyles = {
  position: 'absolute',
  left: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '1.25rem',
  height: '1.25rem',
  color: colors.gray[500]
};

const customDropdownStyles = {
  position: 'relative',
  display: 'inline-block',
  minWidth: '180px'
};

const customSelectStyles = {
  width: '100%',
  padding: '0.75rem 2.5rem 0.75rem 1rem',
  border: `2px solid ${colors.gray[200]}`,
  borderRadius: '12px',
  fontSize: '0.9rem',
  outline: 'none',
  backgroundColor: colors.white,
  appearance: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.3s ease',
  color: colors.gray[800],
};

const dropdownArrowStyles = {
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: colors.gray[500],
  fontSize: '0.8rem'
};

const stickyContainerStyles = {
  position: 'sticky',
  top: 0,
  zIndex: 40,
  backgroundColor: colors.white,
  padding: '1rem 0',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  borderBottom: `1px solid ${colors.gray[200]}`
};

const scrollButtonStyles = {
  padding: '0.5rem',
  border: `2px solid ${colors.gray[200]}`,
  borderRadius: '50%',
  backgroundColor: colors.white,
  cursor: 'pointer',
  fontSize: '1.25rem',
  fontWeight: 'bold',
  color: colors.gray[700],
  width: '2.5rem',
  height: '2.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.3s ease',
};

const categoryListStyles = {
  display: 'flex',
  gap: '0.5rem',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  flex: 1,
};

const categoryButtonStyles = {
  padding: '0.75rem 1.5rem',
  border: `2px solid ${colors.gray[200]}`,
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  backgroundColor: colors.white,
  fontFamily: 'inherit',
  color: colors.gray[700]
};

const selectedCategoryStyle = {
  backgroundColor: colors.primary,
  color: colors.white,
  border: `2px solid ${colors.primary}`,
  fontWeight: '700'
};

const contentStyles = {
  padding: '0 1rem 1rem 1rem',
  backgroundColor: colors.gray[50]
};

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.5rem',
  padding: '1rem 0'
};

const gridItemStyles = {
  padding: '1.5rem',
  border: `1px solid ${colors.gray[200]}`,
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  backgroundColor: colors.white,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const imageContainerStyles = {
  width: '100%',
  height: '200px',
  marginBottom: '1rem',
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.gray[100],
  position: 'relative'
};

const skeletonStyles = {
  width: '100%',
  height: '100%',
  backgroundColor: colors.gray[200],
  borderRadius: '12px',
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
};

const imageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '12px'
};

const contentContainerStyles = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column'
};

const titleContainerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '0.5rem'
};

const itemNameStyles = {
  fontSize: '1.125rem',
  fontWeight: 'bold',
  color: colors.gray[900],
  margin: 0,
  marginBottom: '0.5rem'
};

const itemDescriptionStyles = {
  fontSize: '0.875rem',
  color: colors.gray[600],
  lineHeight: '1.4',
  margin: 0,
  marginBottom: '1rem'
};

const priceCartContainerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  paddingTop: '1rem'
};

const priceStyles = {
  fontSize: '1.125rem',
  fontWeight: 'bold',
  color: colors.secondary,
  margin: 0
};

const quantitySelectorStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: colors.gray[100],
  borderRadius: '25px',
  padding: '0.25rem'
};

const quantityButtonStyles = {
  width: '1.75rem',
  height: '1.75rem',
  border: 'none',
  borderRadius: '50%',
  backgroundColor: colors.white,
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease',
  color: colors.gray[700],
};

const quantityDisplayStyles = {
  minWidth: '1.5rem',
  textAlign: 'center',
  fontSize: '0.9rem',
  fontWeight: '600',
  color: colors.gray[800]
};

const noResultsStyles = {
  textAlign: 'center',
  padding: '3rem',
  color: colors.gray[500],
  fontSize: '1.1rem'
};

const floatingCartButtonStyles = {
  position: 'fixed',
  bottom: '1.5rem',
  left: '1.5rem',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: colors.primary,
  color: colors.white,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 4px 20px rgba(78, 165, 149, 0.4)`,
  zIndex: 30
};

const floatingWhatsAppButtonStyles = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: '#25D366',
  color: colors.white,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
  zIndex: 30
};

const cartBadgeStyles = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  backgroundColor: colors.secondary,
  color: colors.white,
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  fontSize: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold'
};

const cartModalContentStyles = {
  padding: '0 0.5rem'
};

const cartHeaderStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  paddingBottom: '1rem',
  borderBottom: `2px solid ${colors.gray[200]}`,
  paddingRight: '3rem'
};

const cartTitleStyles = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: colors.gray[900],
  margin: 0
};

const clearCartButtonStyles = {
  padding: '0.5rem 1rem',
  border: `1px solid ${colors.secondary}`,
  borderRadius: '20px',
  backgroundColor: 'transparent',
  color: colors.secondary,
  fontSize: '0.8rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
};

const emptyCartStyles = {
  textAlign: 'center',
  color: colors.gray[500],
  fontSize: '1.1rem',
  padding: '2rem'
};

const cartItemsContainerStyles = {
  maxHeight: '300px',
  overflowY: 'auto',
  marginBottom: '1.5rem',
  paddingRight: '0.5rem'
};

const cartItemContainerStyles = {
  border: `1px solid ${colors.gray[200]}`,
  borderRadius: '12px',
  marginBottom: '1rem',
  backgroundColor: colors.gray[50],
  overflow: 'hidden'
};

const cartItemContentStyles = {
  padding: '1.25rem'
};

const cartItemHeaderStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '0.75rem'
};

const cartItemNameStyles = {
  fontWeight: '600',
  fontSize: '1.1rem',
  color: colors.gray[900],
  margin: 0,
  flex: 1,
  textAlign: 'left'
};

const cartRemoveButtonStyles = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  color: colors.gray[500],
  cursor: 'pointer',
  padding: '0',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  transition: 'all 0.2s ease',
};

const cartItemDetailsStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem'
};

const cartItemPriceStyles = {
  color: colors.gray[600],
  fontSize: '0.9rem'
};

const cartItemControlsStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  backgroundColor: colors.white,
  borderRadius: '20px',
  padding: '0.25rem'
};

const cartQuantityButtonStyles = {
  width: '28px',
  height: '28px',
  border: 'none',
  borderRadius: '50%',
  backgroundColor: colors.gray[100],
  color: colors.gray[700],
  cursor: 'pointer',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const cartQuantityStyles = {
  minWidth: '30px',
  textAlign: 'center',
  fontWeight: '600',
  fontSize: '1rem',
  color: colors.gray[800]
};

const cartItemTotalStyles = {
  textAlign: 'left',
  fontWeight: '600',
  color: colors.gray[900],
  fontSize: '1rem',
  paddingTop: '0.5rem',
  borderTop: `1px solid ${colors.gray[200]}`
};

const orderNotesContainerStyles = {
  marginBottom: '1.5rem',
  textAlign: 'left'
};

const orderNotesLabelStyles = {
  display: 'block',
  fontWeight: '600',
  marginBottom: '0.5rem',
  color: colors.gray[900],
  fontSize: '1rem'
};

const orderNotesInputStyles = {
  width: '100%',
  padding: '0.75rem',
  border: `2px solid ${colors.gray[200]}`,
  borderRadius: '12px',
  fontSize: '0.9rem',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
  transition: 'all 0.3s ease',
  backgroundColor: colors.white,
  color: colors.gray[800],
};

const cartTotalContainerStyles = {
  borderTop: `2px solid ${colors.gray[200]}`,
  paddingTop: '1rem',
  marginBottom: '1.5rem'
};

const cartTotalStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: colors.gray[900]
};

const cartTotalPriceStyles = {
  color: colors.secondary,
  fontSize: '1.5rem'
};

const checkoutButtonStyles = {
  width: '100%',
  padding: '1rem 2rem',
  backgroundColor: '#25D366',
  color: colors.white,
  border: 'none',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit',
};

const addToCartButtonStyles = {
  padding: '1rem 2rem',
  backgroundColor: colors.primary,
  color: colors.white,
  border: 'none',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit',
};

const footerStyles = {
  padding: '3rem 1rem 8rem 1rem',
  marginTop: '2rem',
  backgroundColor: colors.white,
  borderTop: `1px solid ${colors.gray[200]}`
};

const copyrightStyles = {
  textAlign: 'center',
  color: colors.gray[500],
  fontSize: '0.9rem',
  lineHeight: '1.6'
};

const developedByStyles = {
  display: 'block',
  marginTop: '0.5rem',
  fontStyle: 'italic',
  color: colors.gray[400],
  fontSize: '0.8rem'
};
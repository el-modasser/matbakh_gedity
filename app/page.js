'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import menuData from '@/data/menu.json';
import { motion, AnimatePresence } from 'framer-motion';
import { transform } from 'typescript';

// Language configuration
const languages = {
  en: { code: 'en', name: 'English', dir: 'ltr' },
  ar: { code: 'ar', name: 'العربية', dir: 'rtl' }
};

// Helper function to format prices
const formatPrice = (price, language = 'ar') => {
  if (price === null || price === undefined || price === '') {
    return language === 'en' ? 'EGP 0' : 'ج.م 0';
  }

  if (Array.isArray(price)) {
    if (price.length === 0) {
      return language === 'en' ? 'EGP 0' : 'ج.م 0';
    }

    const minPrice = Math.min(...price);
    const maxPrice = Math.max(...price);

    if (minPrice === maxPrice) {
      return `EGP ${minPrice.toLocaleString()}`;
    } else {
      return language === 'en'
        ? `EGP ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
        : `ج.م ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`;
    }
  }

  return `EGP ${price.toLocaleString()}`;
};

// Helper function to get text based on language
const getText = (item, field, language) => {
  if (!item) return '';

  if (language === 'ar') {
    return item[`${field}_ar`] || item[field] || '';
  }
  return item[field] || '';
};

// Updated color system
const colors = {
  primary: '#4EA595',
  secondary: '#EB4B36',
  accent: '#F8F5F0',
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717'
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
  const [visibleItems, setVisibleItems] = useState(1000);
  const [imageLoadStates, setImageLoadStates] = useState({});
  const [language, setLanguage] = useState('ar');
  const [heroImagesLoaded, setHeroImagesLoaded] = useState({});

  const categoriesRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Set document language only (no direction change)
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Preload all hero images on component mount
  useEffect(() => {
    const preloadAllHeroImages = () => {
      Object.keys(menuData).forEach(categoryId => {
        const categoryData = menuData[categoryId];
        const heroImage = categoryData?.heroImage || 'trays.png';
        const imageSrc = `/images/hero/${heroImage}`;

        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          setHeroImagesLoaded(prev => ({
            ...prev,
            [categoryId]: true
          }));
        };
        img.onerror = () => {
          setHeroImagesLoaded(prev => ({
            ...prev,
            [categoryId]: true
          }));
        };
      });
    };

    preloadAllHeroImages();
  }, []);

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
    setVisibleItems(1000);
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

  // Drag scroll functionality for categories
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
    setScrollLeft(categoryScrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoryScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - categoryScrollRef.current.offsetLeft);
    setScrollLeft(categoryScrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoryScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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
    const whatsappNumber = "+201035087703";
    let message = language === 'en'
      ? "Hello! I'd like to place an order from Matbakh Gedity.\n\n"
      : "مرحباً! أود تقديم طلب من مطبخ جديتي.\n\n";

    cart.forEach(item => {
      const itemName = language === 'ar' && item.name_ar ? item.name_ar : item.name;
      message += `• ${item.quantity}x ${itemName} - EGP ${((item.price || 0) * (item.quantity || 0)).toLocaleString()}\n`;
    });

    message += `\n${language === 'en' ? 'Total' : 'المجموع'}: EGP ${getTotalPrice().toLocaleString()}`;

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
      scale: 0.9
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

  // Get hero image source
  const getHeroImageSrc = () => {
    const categoryData = menuData[selectedCategory];
    const heroImage = categoryData?.heroImage || 'trays.png';
    return `/images/hero/${heroImage}`;
  };

  // Check if current hero image is loaded
  const isCurrentHeroLoaded = heroImagesLoaded[selectedCategory];

  return (
    <Layout>
      {/* Language Switcher */}
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

      {/* Sticky Categories Navigation with Drag Scroll */}
      <div
        ref={categoriesRef}
        className={`sticky-categories ${isSticky ? 'sticky' : ''}`}
        style={stickyContainerStyles}
      >
        <div
          ref={categoryScrollRef}
          style={{
            ...categoryListStyles,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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
      </div>

      {/* SIMPLE HERO SECTION - NO FLICKERING */}
      <motion.div
        style={heroContainerStyles}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        key={selectedCategory}
      >
        <div style={heroImageWrapperStyles}>
          {/* Always show the image - let browser handle caching */}
          <motion.img
            src={getHeroImageSrc()}
            alt={getText(menuData[selectedCategory], 'name', language)}
            style={heroImageStyles}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onError={(e) => {
              // If image fails, it will just show the background color
              console.error('Hero image failed to load:', getHeroImageSrc());
            }}
          />
        </div>
        <div style={heroOverlayStyles}>
          <motion.div
            style={heroContentStyles}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >

          </motion.div>
        </div>
      </motion.div>

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
                  y: -8,
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
                      textAlign: language === 'ar' ? 'right' : 'left'
                    }}>
                      {getText(item, 'name', language)}
                    </h3>
                  </div>

                  <p style={{
                    ...itemDescriptionStyles,
                    textAlign: language === 'ar' ? 'right' : 'left'
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

      {/* Single Proceed to Order Button */}
      {getTotalItems() > 0 && (
        <motion.button
          onClick={() => setIsCartOpen(true)}
          style={proceedButtonStyles}
          className="proceed-order-btn"
        >
          <span style={proceedButtonTextStyles}>
            {language === 'en' ? 'Proceed to Order' : 'المتابعة للطلب'}
          </span>
          <span style={proceedButtonBadgeStyles}>
            {getTotalItems()} • {language === 'en' ? 'EGP' : 'ج.م'} {getTotalPrice().toLocaleString()}
          </span>
        </motion.button>
      )}

      {/* Enhanced Order Summary Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            style={modalOverlayStyles}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Glass-like Backdrop */}
            <motion.div
              style={glassBackdropStyles}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
            />

            {/* Enhanced Modal Container */}
            <motion.div
              style={modalContainerStyles}
              initial={{
                scale: 0.8,
                opacity: 0,
                y: 20
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
                y: 20
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
            >
              <div style={modalContentStyles}>
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
                  <motion.div
                    style={emptyCartStyles}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m5.5 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                    <p>{language === 'en' ? 'No items in your order' : 'لا توجد عناصر في طلبك'}</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
                      {language === 'en' ? 'Select your favorite dishes to get started' : 'اختر أطباقك المفضلة لبدء الطلب'}
                    </p>
                  </motion.div>
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
                                {language === 'en' ? 'EGP' : 'ج.م'} {item.price.toLocaleString()} {language === 'en' ? 'each' : 'للقطعة'}
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
                              {language === 'en' ? 'Total' : 'المجموع'}: <strong>{language === 'en' ? 'EGP' : 'ج.م'} {((item.price || 0) * (item.quantity || 0)).toLocaleString()}</strong>
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
                          {language === 'en' ? 'EGP' : 'ج.م'} {getTotalPrice().toLocaleString()}
                        </strong>
                      </div>
                    </motion.div>

                    <motion.button
                      onClick={handleWhatsAppOrder}
                      style={checkoutButtonStyles}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem' }}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.169-3.495-8.418" />
                      </svg>
                      {language === 'en' ? 'Send Order via WhatsApp' : 'إرسال الطلب عبر واتساب'}
                    </motion.button>
                  </>
                )}

                {/* Close Button at Bottom */}
                <motion.button
                  onClick={() => setIsCartOpen(false)}
                  style={modalCloseButtonStyles}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {language === 'en' ? 'Close' : 'إغلاق'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Item Detail Modal */}
      <AnimatePresence>
        {isItemModalOpen && selectedItem && (
          <motion.div
            style={modalOverlayStyles}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Glass-like Backdrop */}
            <motion.div
              style={glassBackdropStyles}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsItemModalOpen(false)}
            />

            {/* Enhanced Modal Container */}
            <motion.div
              style={modalContainerStyles}
              initial={{
                scale: 0.8,
                opacity: 0,
                y: 20
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
                y: 20
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
            >
              <div style={itemModalContentStyles}>
                {selectedItem.image && (
                  <motion.div
                    style={itemModalImageContainerStyles}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <img
                      src={`/images/${selectedCategory}/${selectedItem.image}`}
                      alt={getText(selectedItem, 'name', language)}
                      style={itemModalImageStyles}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </motion.div>
                )}
                <motion.h2
                  style={itemModalTitleStyles}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {getText(selectedItem, 'name', language)}
                </motion.h2>

                <motion.p
                  style={itemModalDescriptionStyles}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {getText(selectedItem, 'description', language)}
                </motion.p>
                <motion.p
                  style={itemModalPriceStyles}
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {language === 'en' ? 'Add to Cart' : 'أضف إلى السلة'}
                </motion.button>

                {/* Close Button at Bottom */}
                <motion.button
                  onClick={() => setIsItemModalOpen(false)}
                  style={modalCloseButtonStyles}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {language === 'en' ? 'Close' : 'إغلاق'}
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
          <span style={developedByStyles}>Crafted with excellence</span>
        </div>
      </footer>

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
          --color-primary: #4EA595;
          --color-secondary: #EB4B36;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        html {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          scroll-behavior: smooth;
        }
        
        body {
          background: #ffffff;
          color: #000000;
          line-height: 1.6;
          font-weight: 400;
          overflow-x: hidden;
        }
        
        /* Remove all scrollbars */
        ::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Focus styles for accessibility */
        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 2px solid #4EA595;
          outline-offset: 2px;
        }
        
        /* Selection color */
        ::selection {
          background: #4EA595;
          color: white;
        }
      `}</style>
    </Layout>
  );
}

// ==================== STYLES ====================

// Modal Styles
const modalOverlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem'
};

const glassBackdropStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backdropFilter: 'blur(8px)',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  WebkitBackdropFilter: 'blur(8px)'
};

const modalContainerStyles = {
  position: 'relative',
  borderRadius: '16px',
  backgroundColor: 'white',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  maxWidth: '500px',
  width: '100%',
  maxHeight: '85vh',
  overflow: 'auto',
  margin: '0 auto',
  WebkitOverflowScrolling: 'touch',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
};

const modalContentStyles = {
  padding: '2rem 1.5rem 1.5rem'
};

const itemModalContentStyles = {
  padding: '2.5rem 2rem 2rem',
  textAlign: 'center'
};

const itemModalImageContainerStyles = {
  width: '180px',
  height: '180px',
  margin: '0 auto 1.5rem',
  borderRadius: '16px',
  overflow: 'hidden'
};

const itemModalImageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const itemModalTitleStyles = {
  fontSize: '1.75rem',
  fontWeight: 'bold',
  color: colors.black,
  margin: '0 0 1rem 0',
  lineHeight: '1.2'
};

const itemModalDescriptionStyles = {
  fontSize: '1rem',
  color: colors.gray[600],
  lineHeight: '1.6',
  margin: '0 0 1.5rem 0'
};

const itemModalPriceStyles = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: colors.secondary,
  margin: '0 0 2rem 0'
};

// New Proceed Button Styles
const proceedButtonStyles = {
  position: 'fixed',
  bottom: '1rem',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'calc(100% - 3rem)',
  maxWidth: '400px',
  padding: '1rem 1.5rem',
  backgroundColor: colors.primary,
  color: colors.white,
  border: 'none',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  zIndex: 30,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  fontFamily: 'inherit'
};

const proceedButtonTextStyles = {
  fontSize: '1.1rem',
  fontWeight: '600'
};

const proceedButtonBadgeStyles = {
  fontSize: '0.9rem',
  opacity: 0.9,
  fontWeight: '500'
};

// Modal Close Button
const modalCloseButtonStyles = {
  width: '100%',
  padding: '0.875rem 1.5rem',
  backgroundColor: colors.gray[200],
  color: colors.gray[700],
  border: 'none',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit',
  marginTop: '1rem'
};

// Hero Image Styles - SIMPLIFIED
const heroContainerStyles = {
  position: 'relative',
  width: '100%',
  height: '300px',
  overflow: 'hidden',
  marginBottom: '2rem'
};

const heroImageWrapperStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.gray[100] // Fallback background
};

const heroImageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const heroOverlayStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, rgba(78, 165, 149, 0.3) 0%, rgba(235, 75, 54, 0.2) 100%)'
};

const heroContentStyles = {
  textAlign: 'center',
  color: 'white',
  maxWidth: '600px',
  padding: '0 2rem'
};

const heroTitleStyles = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  margin: '0 0 1rem 0',
  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  lineHeight: '1.1'
};

const heroDescriptionStyles = {
  fontSize: '1.1rem',
  margin: 0,
  opacity: 0.9,
  textShadow: '0 1px 5px rgba(0,0,0,0.3)',
  lineHeight: '1.4'
};

// Component Styles
const languageSwitcherStyles = {
  position: 'absolute',
  top: '0rem',
  right: '0rem',
  transform: 'translateX(-1rem)',
  display: 'flex',
  justifyContent: 'center',
  gap: '0.25rem',
  backgroundColor: colors.white,
  padding: '0.5rem',
  borderRadius: '12px',
  border: `1px solid ${colors.gray[200]}`,
  margin: '0.5rem auto',
  width: 'fit-content',
};

const languageButtonStyles = {
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: 'transparent',
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
};

const searchContainerStyles = {
  display: 'flex',
  gap: '1rem',
  padding: '1.5rem',
  alignItems: 'center',
  flexWrap: 'wrap',
  backgroundColor: colors.white,
  marginTop: '0',
  justifyContent: 'center'
};

const searchBarStyles = {
  position: 'relative',
  flex: 1,
  minWidth: '280px',
  maxWidth: '400px'
};

const searchInputStyles = {
  width: '100%',
  padding: '0.875rem 1rem 0.875rem 3rem',
  border: `1px solid ${colors.gray[300]}`,
  borderRadius: '12px',
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.3s ease',
  backgroundColor: colors.gray[50],
  fontFamily: 'inherit',
  color: colors.gray[800],
};

const searchIconStyles = {
  position: 'absolute',
  left: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '1.25rem',
  height: '1.25rem',
  color: colors.gray[500]
};

const customDropdownStyles = {
  position: 'relative',
  display: 'inline-block',
  minWidth: '200px'
};

const customSelectStyles = {
  width: '100%',
  padding: '0.875rem 2.5rem 0.875rem 1rem',
  border: `1px solid ${colors.gray[300]}`,
  borderRadius: '12px',
  fontSize: '0.9rem',
  outline: 'none',
  backgroundColor: colors.gray[50],
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
  padding: '1rem 1.5rem',
  transition: 'all 0.3s ease',
  borderBottom: `1px solid ${colors.gray[200]}`
};

const categoryListStyles = {
  display: 'flex',
  gap: '0.75rem',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  flex: 1,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  padding: '0.5rem 0'
};

const categoryButtonStyles = {
  padding: '0.75rem 1.5rem',
  border: `1px solid ${colors.gray[300]}`,
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  backgroundColor: colors.white,
  fontFamily: 'inherit',
  color: colors.gray[700],
};

const selectedCategoryStyle = {
  backgroundColor: colors.primary,
  color: colors.white,
  border: `1px solid ${colors.primary}`,
  fontWeight: '700'
};

const contentStyles = {
  padding: '0 1.5rem 2rem 1.5rem',
  backgroundColor: colors.white,
  minHeight: '60vh'
};

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '2rem',
  padding: '1rem 0'
};

const gridItemStyles = {
  padding: '1.5rem',
  border: `1px solid ${colors.gray[200]}`,
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  backgroundColor: colors.white,
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
  borderRadius: '12px'
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
  marginBottom: '0.75rem'
};

const itemNameStyles = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: colors.black,
  margin: 0,
  marginBottom: '0.5rem',
  lineHeight: '1.4'
};

const itemDescriptionStyles = {
  fontSize: '0.9rem',
  color: colors.gray[600],
  lineHeight: '1.5',
  margin: 0,
  marginBottom: '1rem'
};

const priceCartContainerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  paddingTop: '1rem',
  borderTop: `1px solid ${colors.gray[200]}`
};

const priceStyles = {
  fontSize: '1rem',
  fontWeight: 'bold',
  color: colors.secondary,
  margin: 0
};

const quantitySelectorStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: colors.gray[100],
  borderRadius: '20px',
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
  padding: '4rem 2rem',
  color: colors.gray[500],
  fontSize: '1.1rem'
};

const cartHeaderStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: `2px solid ${colors.gray[200]}`
};

const cartTitleStyles = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: colors.black,
  margin: 0
};

const clearCartButtonStyles = {
  padding: '0.5rem 1rem',
  border: `1px solid ${colors.gray[400]}`,
  borderRadius: '20px',
  backgroundColor: 'transparent',
  color: colors.gray[600],
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
  padding: '3rem 2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
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
  marginBottom: '1rem'
};

const cartItemNameStyles = {
  fontWeight: '600',
  fontSize: '1rem',
  color: colors.black,
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
  marginBottom: '1rem'
};

const cartItemPriceStyles = {
  color: colors.gray[600],
  fontSize: '0.9rem'
};

const cartItemControlsStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
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
  fontSize: '1rem',
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
  color: colors.black
};

const cartItemTotalStyles = {
  textAlign: 'left',
  fontWeight: '600',
  color: colors.black,
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
  color: colors.black,
  fontSize: '1rem'
};

const orderNotesInputStyles = {
  width: '100%',
  padding: '0.75rem',
  border: `1px solid ${colors.gray[300]}`,
  borderRadius: '12px',
  fontSize: '0.9rem',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
  transition: 'all 0.3s ease',
  backgroundColor: colors.gray[50],
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
  color: colors.black
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
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const addToCartButtonStyles = {
  width: '100%',
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
  padding: '3rem 1.5rem 8rem 1.5rem',
  marginTop: '3rem',
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
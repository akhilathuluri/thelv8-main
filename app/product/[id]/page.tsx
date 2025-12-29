'use client';

import { useEffect, useState, useRef } from 'react';
import { Heart, Share2, Truck, RefreshCw, Shield, Star, Loader2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { productService } from '@/services/product.service';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/helpers';
import { toast } from 'sonner';
import type { Product, ProductColor } from '@/types';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const hasLoadedRef = useRef<string | null>(null);

  const { addItem, items } = useCart();
  const { items: wishlistItems, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    if (hasLoadedRef.current !== productId) {
      hasLoadedRef.current = productId;
      loadProduct();
    }
  }, [productId]);

  // Helper to normalize color data - supports both string[] and ProductColor[]
  function normalizeColor(color: string | ProductColor): ProductColor {
    if (typeof color === 'string') {
      // Convert string to ProductColor object with a default hex
      return {
        name: color,
        hex: '#808080', // Default gray color
      };
    }
    return color;
  }

  async function loadProduct() {
    try {
      setLoading(true);
      const productData = await productService.getProductById(productId);

      if (!productData) {
        toast.error('Product not found');
        router.push('/shop');
        return;
      }

      setProduct(productData);

      // Set default selections
      if (productData.sizes && productData.sizes.length > 0) {
        setSelectedSize(productData.sizes[0]);
      }
      if (productData.colors && productData.colors.length > 0) {
        const normalizedColor = normalizeColor(productData.colors[0]);
        setSelectedColor(normalizedColor.name);
      }

      // Load related products
      if (productData.category_id) {
        const related = await productService.getRelatedProducts(productId, productData.category_id, 4);
        setRelatedProducts(related);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    if (!product) return;

    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    // Get available stock based on size selection
    const availableStock = selectedSize && product.stock_by_size?.[selectedSize]
      ? product.stock_by_size[selectedSize]
      : product.stock;

    // Check if adding this quantity would exceed available stock
    const existingCartItem = items.find(
      item => item.product_id === product.id &&
        item.selected_size === (selectedSize || '') &&
        item.selected_color === (selectedColor || '')
    );

    const totalQuantity = (existingCartItem?.quantity || 0) + quantity;

    if (totalQuantity > availableStock) {
      const remaining = availableStock - (existingCartItem?.quantity || 0);
      if (remaining <= 0) {
        toast.error('This item is already in your cart at maximum available quantity');
      } else {
        toast.error(`Only ${remaining} more available in stock`);
      }
      return;
    }

    addItem(
      product.id,
      selectedColor || '',
      selectedSize || '',
      quantity
    );

    toast.success('Added to cart!');
  }

  function handleWishlistToggle() {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    if (product) {
      toggleWishlist(product.id);
    }
  }

  function isInWishlist(): boolean {
    return product ? wishlistItems.some(item => item.product_id === product.id) : false;
  }

  async function handleShare() {
    try {
      await navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800'];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/shop" className="text-stone-600 hover:text-stone-900 transition-colors">
            ← Back to Shop
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          <div>
            <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-stone-100 mb-4 shadow-lg">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">Out of Stock</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative overflow-hidden rounded-xl aspect-[3/4] transition-all duration-300 ${selectedImage === idx ? 'ring-2 ring-stone-900 shadow-lg' : 'opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:pl-8">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-light text-stone-900 mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <p className="text-2xl font-light text-stone-400 line-through">
                    {formatPrice(product.compare_at_price)}
                  </p>
                )}
                <p className="text-3xl font-light text-stone-900">
                  {formatPrice(product.price)}
                </p>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Save {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-lg text-stone-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-3">
                    Select Color
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {product.colors.map((color, idx) => {
                      const normalizedColor = normalizeColor(color);
                      return (
                        <button
                          key={`${normalizedColor.name}-${idx}`}
                          onClick={() => setSelectedColor(normalizedColor.name)}
                          className={`px-4 py-2 rounded-full border-2 transition-all duration-300 ${selectedColor === normalizedColor.name
                            ? 'border-stone-900 bg-stone-100 scale-105 shadow-md'
                            : 'border-stone-300 hover:border-stone-400'
                            }`}
                          style={{
                            borderColor: selectedColor === normalizedColor.name ? '#1c1917' : normalizedColor.hex,
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-stone-300"
                              style={{ backgroundColor: normalizedColor.hex }}
                            />
                            {normalizedColor.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-3">
                    Select Size
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {product.sizes.map((size) => {
                      const sizeStock = product.stock_by_size?.[size] || 0;
                      const isOutOfStock = sizeStock === 0;

                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`px-6 py-3 rounded-full border-2 transition-all duration-300 font-medium relative ${selectedSize === size
                            ? 'bg-stone-900 text-white border-stone-900 shadow-lg'
                            : isOutOfStock
                              ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                              : 'bg-white text-stone-900 border-stone-300 hover:border-stone-900'
                            }`}
                        >
                          <span className="flex flex-col items-center gap-1">
                            <span>{size}</span>
                            {isOutOfStock ? (
                              <span className="text-xs text-stone-400">Out of stock</span>
                            ) : (
                              <span className={`text-xs ${selectedSize === size ? 'text-white/80' : 'text-stone-500'}`}>
                                {sizeStock} left
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full border-2 border-stone-300 hover:border-stone-900 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => {
                      const maxStock = selectedSize && product.stock_by_size?.[selectedSize]
                        ? product.stock_by_size[selectedSize]
                        : product.stock;
                      setQuantity(Math.min(maxStock, quantity + 1));
                    }}
                    disabled={(() => {
                      const maxStock = selectedSize && product.stock_by_size?.[selectedSize]
                        ? product.stock_by_size[selectedSize]
                        : product.stock;
                      return quantity >= maxStock;
                    })()}
                    className="w-10 h-10 rounded-full border-2 border-stone-300 hover:border-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  {(() => {
                    const maxStock = selectedSize && product.stock_by_size?.[selectedSize]
                      ? product.stock_by_size[selectedSize]
                      : product.stock;
                    return maxStock > 0 && (
                      <span className="text-sm text-stone-600 ml-2">
                        {maxStock} available
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 px-8 py-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleWishlistToggle}
                className="p-4 border-2 border-stone-300 rounded-full hover:border-stone-900 hover:bg-stone-50 transition-all duration-300"
              >
                <Heart className={`w-6 h-6 ${isInWishlist() ? 'fill-red-500 text-red-500' : 'text-stone-700'}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-4 border-2 border-stone-300 rounded-full hover:border-stone-900 hover:bg-stone-50 transition-all duration-300"
              >
                <Share2 className="w-6 h-6 text-stone-700" />
              </button>
            </div>

            <div className="border-t border-stone-200 pt-8">
              <h3 className="font-medium text-stone-900 mb-4">Product Details</h3>
              <div className="space-y-2 text-stone-600">
                <p><strong>SKU:</strong> {product.sku || 'N/A'}</p>
                {product.stock > 0 && (
                  <p><strong>Availability:</strong> In Stock ({product.stock} units)</p>
                )}
                {product.stock === 0 && (
                  <p className="text-red-600"><strong>Availability:</strong> Out of Stock</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-stone-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 mb-1">Free Shipping</p>
                  <p className="text-sm text-stone-600">On orders over ₹2000</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 mb-1">Easy Returns</p>
                  <p className="text-sm text-stone-600">7-day return policy</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 mb-1">Secure Payment</p>
                  <p className="text-sm text-stone-600">Protected checkout</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-4xl font-light text-stone-900 mb-12 text-center">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/product/${relatedProduct.id}`} className="group">
                  <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-white mb-4 shadow-md hover:shadow-xl transition-all duration-500">
                    <img
                      src={relatedProduct.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-stone-900 group-hover:text-amber-700 transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-xl font-light text-stone-900">{formatPrice(relatedProduct.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

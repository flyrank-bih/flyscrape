export const BLOG_POST_HTML = `
<!DOCTYPE html>
<html>
<head><title>Blog Post</title></head>
<body>
  <header id="site-header">
    <nav class="main-navigation">
      <ul><li>Home</li><li>About</li><li>Blog</li></ul>
    </nav>
  </header>
  
  <div class="container">
    <main class="content">
      <article>
        <h1>How to Migrate from Craft Commerce</h1>
        <p class="meta">Posted on Jan 1, 2024 by Admin</p>
        
        <div class="post-content">
          <p>This is the first paragraph of the main content. It discusses migration steps.</p>
          <p>Here is another paragraph with more details about the process.</p>
          <img src="diagram.png" alt="Migration Diagram" />
          
          <h2>Step 1: Export Data</h2>
          <p>Make sure to export your data correctly.</p>
        </div>
        
        <div class="share-buttons">
          <button>Share on Facebook</button>
          <button>Share on Twitter</button>
        </div>
        
        <div id="comments">
          <h3>Comments</h3>
          <div class="comment">Great post!</div>
        </div>
      </article>
    </main>
    
    <aside class="sidebar">
      <div class="widget-search">Search...</div>
      <div class="related-posts">
        <h3>Related Posts</h3>
        <ul><li>Other Guide</li></ul>
      </div>
      <div class="ad-wrapper">
        <img src="ad.jpg" />
      </div>
    </aside>
  </div>
  
  <footer>
    <p>&copy; 2024 Power Commerce. All rights reserved.</p>
    <div class="footer-links">Privacy Policy</div>
  </footer>
</body>
</html>
`;

export const ECOMMERCE_PRODUCT_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div id="shopify-section-header">Header</div>
  
  <div class="product-page">
    <div class="product-gallery">
      <img src="product.jpg" />
    </div>
    
    <div class="product-info">
      <h1>Awesome Widget</h1>
      <div class="price-box">$19.99</div>
      
      <form class="product-form" action="/cart/add">
        <button type="submit" name="add" class="add-to-cart">Add to Cart</button>
      </form>
      
      <div class="product-description">
        <p>This is an awesome widget that solves all your problems.</p>
        <ul>
          <li>Feature 1</li>
          <li>Feature 2</li>
        </ul>
        <p>Buy it now and save big!</p>
      </div>
    </div>
  </div>
  
  <div id="shopify-section-footer">Footer</div>
  <div class="cart-drawer">Your cart is empty</div>
</body>
</html>
`;

export const NOISY_PAGE_HTML = `
<html>
<body>
  <div class="cookie-consent">Accept Cookies</div>
  <div class="newsletter-popup">Subscribe!</div>
  
  <div class="main-wrapper">
    <div class="breadcrumbs">Home > Blog > Post</div>
    
    <div class="article-body">
      <p>This is the real content hidden deeply.</p>
      <p>It has multiple paragraphs to score higher.</p>
      <p>We want to extract this part and ignore the rest.</p>
    </div>
    
    <div class="sidebar">
      <div class="author-box">Author Info</div>
    </div>
  </div>
</body>
</html>
`;

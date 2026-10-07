# FR SHOP

Boutique française d'électronique : smartphones, ordinateurs, montres, accessoires PC, gaming et audio.

## Fonctionnalités
- Livraison gratuite en France.
- Prix en USDT.
- Lien Binance individuel pour chaque produit.
- Moyens de paiement crypto ajoutés manuellement depuis le Dashboard.
- Gestion locale des produits, paiements et commandes.
- Interface responsive.

## Accès admin
Le mot de passe de démonstration dans `admin.js` est `change-me`. **Changez-le avant mise en production.**

## Important
La bannière fournie par l'utilisateur est actuellement référencée par son URL signée Cloudflare R2. Cette URL est temporaire. Pour une production durable, téléversez la bannière dans le dépôt (par exemple `assets/banner.png`) ou utilisez une URL publique permanente.

Cette première version utilise localStorage afin de pouvoir fonctionner immédiatement sur GitHub Pages/Vercel sans backend. Pour une vraie boutique multi-appareils, remplacez le stockage local par Supabase (produits, commandes, paiements et stockage des images).

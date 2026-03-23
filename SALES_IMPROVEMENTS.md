# Améliorations du Module Sales

## 📧 Service d'Emailing (sales-mail.service.ts)

### Fonctionnalités
- Envoi automatique d'emails professionnels avec templates HTML élégants
- Support des pièces jointes PDF
- Templates personnalisés pour chaque type de document

### Méthodes disponibles

#### 1. `sendInvoiceEmail(invoice, recipientEmail, pdfBuffer?)`
Envoie une facture par email avec:
- Design professionnel avec gradient violet
- Détails de la facture (numéro, dates, montants)
- Notes personnalisées
- PDF en pièce jointe (optionnel)

#### 2. `sendQuoteEmail(quote, recipientEmail, pdfBuffer?)`
Envoie un devis par email avec:
- Design professionnel avec gradient vert
- Date de validité mise en évidence
- Montant total
- PDF en pièce jointe (optionnel)

#### 3. `sendSalesOrderEmail(order, recipientEmail, pdfBuffer?)`
Envoie une confirmation de commande avec:
- Design professionnel avec gradient rose
- Statut de la commande
- Badge de confirmation
- PDF en pièce jointe (optionnel)

#### 4. `sendDeliveryNoteEmail(deliveryNote, recipientEmail, pdfBuffer?)`
Envoie un bon de livraison avec:
- Design professionnel avec gradient bleu
- Date de livraison
- Instructions de réception
- PDF en pièce jointe (optionnel)

#### 5. `sendPaymentReminder(invoice, recipientEmail)`
Envoie un rappel de paiement avec:
- Design d'alerte (gradient rouge/orange)
- Calcul automatique des jours de retard
- Montant dû mis en évidence
- Message d'urgence

### Configuration requise
```env
GMAIL_USER=votre-email@gmail.com
GMAIL_PASS=votre-mot-de-passe-app
```

---

## 🔍 Service OCR (sales-ocr.service.ts)

### Fonctionnalités
- Scan intelligent de documents de vente
- Détection automatique du type de document
- Extraction de données structurées
- Support multi-formats (PDF, JPG, PNG)

### Méthodes disponibles

#### `extractFromFile(filePath): Promise<SalesDocumentOcrResult>`
Extrait les données d'un document scanné:

**Données extraites:**
- `document_type`: Type détecté (invoice, quote, delivery_note, order, unknown)
- `document_number`: Numéro du document
- `document_date`: Date du document (format ISO)
- `client_name`: Nom du client
- `client_address`: Adresse du client
- `client_tax_id`: Matricule fiscal
- `items[]`: Liste des articles avec quantité, prix unitaire, total
- `subtotal_ht`: Total HT
- `tax_amount`: Montant TVA
- `total_ttc`: Total TTC
- `payment_terms`: Conditions de paiement
- `notes`: Notes/remarques
- `raw_text`: Texte brut extrait
- `confidence`: Score de confiance (0-100)
- `processing_time_ms`: Temps de traitement

### Configuration requise
```env
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_LANG=eng
POPPLER_PATH=C:\poppler\poppler-25.12.0\Library\bin
```

---

## 🎯 Contrôleur OCR (sales-ocr.controller.ts)

### Endpoints disponibles

#### `POST /businesses/:businessId/sales/ocr/scan`
Scan générique - détecte automatiquement le type de document
- **Upload**: Fichier (JPG, PNG, PDF, max 10MB)
- **Retour**: Données extraites avec type détecté

#### `POST /businesses/:businessId/sales/ocr/scan-invoice`
Scan spécifique pour factures
- **Upload**: Fichier (JPG, PNG, PDF, max 10MB)
- **Validation**: Vérifie que c'est bien une facture
- **Retour**: Données de facture extraites

#### `POST /businesses/:businessId/sales/ocr/scan-quote`
Scan spécifique pour devis
- **Upload**: Fichier (JPG, PNG, PDF, max 10MB)
- **Validation**: Vérifie que c'est bien un devis
- **Retour**: Données de devis extraites

### Sécurité
- Authentification JWT requise
- Rôles autorisés: BUSINESS_OWNER, BUSINESS_ADMIN, ACCOUNTANT
- Validation des types de fichiers
- Limite de taille: 10MB
- Nettoyage automatique des fichiers temporaires

---

## 📝 Mise à jour du Service Factures

### Nouvelles méthodes

#### `sendByEmail(businessId, invoiceId, recipientEmail?)`
Envoie une facture par email
- Utilise l'email du client si non fourni
- Change le statut de DRAFT à SENT automatiquement
- Retourne la facture mise à jour

#### `sendPaymentReminder(businessId, invoiceId, recipientEmail?)`
Envoie un rappel de paiement
- Vérifie que la facture est OVERDUE ou SENT
- Calcule les jours de retard
- Envoie un email d'alerte

---

## 🌐 Nouveaux Endpoints API

### Factures

#### `POST /businesses/:businessId/invoices/:id/send-email`
Envoie une facture par email
```json
{
  "email": "client@example.com"  // Optionnel
}
```

#### `POST /businesses/:businessId/invoices/:id/send-reminder`
Envoie un rappel de paiement
```json
{
  "email": "client@example.com"  // Optionnel
}
```

---

## 🎨 Composants Frontend

### 1. SalesOcrModal.tsx
Modal pour scanner des documents de vente

**Fonctionnalités:**
- Interface drag & drop élégante
- Upload de fichiers (JPG, PNG, PDF)
- Prévisualisation du fichier sélectionné
- Affichage des résultats du scan
- Extraction automatique des données
- Utilisation directe des données scannées

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: any) => void;
  documentType?: 'invoice' | 'quote' | 'delivery_note' | 'order';
  businessId: string;
}
```

### 2. SendInvoiceEmailModal.tsx
Modal pour envoyer une facture par email

**Fonctionnalités:**
- Interface d'envoi intuitive
- Pré-remplissage avec l'email du client
- Affichage des informations de la facture
- Messages de succès/erreur
- Design moderne et responsive

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  businessId: string;
  onSuccess?: () => void;
}
```

---

## 📦 Installation des dépendances

### Backend
```bash
npm install nodemailer
npm install @types/nodemailer --save-dev
npm install @nestjs/platform-express
npm install @nestjs/config
```

### Tesseract OCR (Windows)
1. Télécharger depuis: https://github.com/UB-Mannheim/tesseract/wiki
2. Installer dans `C:\Program Files\Tesseract-OCR`
3. Ajouter au PATH ou configurer dans .env

### Poppler (pour PDF)
1. Télécharger depuis: https://github.com/oschwartz10612/poppler-windows/releases
2. Extraire dans `C:\poppler`
3. Configurer le chemin dans .env

---

## 🚀 Utilisation

### Exemple: Envoyer une facture par email

**Backend:**
```typescript
await this.invoicesService.sendByEmail(
  businessId,
  invoiceId,
  'client@example.com'
);
```

**Frontend:**
```typescript
<SendInvoiceEmailModal
  isOpen={showEmailModal}
  onClose={() => setShowEmailModal(false)}
  invoice={selectedInvoice}
  businessId={businessId}
  onSuccess={() => {
    toast.success('Facture envoyée!');
    refreshInvoices();
  }}
/>
```

### Exemple: Scanner un document

**Frontend:**
```typescript
<SalesOcrModal
  isOpen={showOcrModal}
  onClose={() => setShowOcrModal(false)}
  documentType="invoice"
  businessId={businessId}
  onScanComplete={(data) => {
    // Utiliser les données extraites
    setFormData({
      documentNumber: data.document_number,
      date: data.document_date,
      clientName: data.client_name,
      totalHT: data.subtotal_ht,
      totalTTC: data.total_ttc,
      items: data.items,
    });
  }}
/>
```

---

## ✅ Checklist d'intégration

### Backend
- [x] Service d'emailing créé
- [x] Service OCR créé
- [x] Contrôleur OCR créé
- [x] Service factures mis à jour
- [x] Contrôleur factures mis à jour
- [x] Module sales mis à jour
- [x] Configuration .env vérifiée

### Frontend
- [x] Composant SalesOcrModal créé
- [x] Composant SendInvoiceEmailModal créé
- [ ] Intégration dans les pages de vente
- [ ] Tests des fonctionnalités

### Configuration
- [ ] Tesseract OCR installé
- [ ] Poppler installé (pour PDF)
- [ ] Variables d'environnement configurées
- [ ] Compte Gmail configuré avec mot de passe d'application

---

## 🎯 Prochaines étapes

1. **Intégrer les composants dans les pages:**
   - Ajouter bouton "Scanner" dans les formulaires
   - Ajouter bouton "Envoyer par email" dans les listes
   - Ajouter bouton "Rappel de paiement" pour factures en retard

2. **Améliorer l'OCR:**
   - Ajouter support pour plus de langues
   - Améliorer la détection des tableaux
   - Ajouter validation des données extraites

3. **Améliorer l'emailing:**
   - Ajouter templates personnalisables
   - Ajouter historique des emails envoyés
   - Ajouter planification d'envoi

4. **Tests:**
   - Tests unitaires des services
   - Tests d'intégration des endpoints
   - Tests E2E des composants frontend

---

## 📞 Support

Pour toute question ou problème:
1. Vérifier la configuration .env
2. Vérifier les logs du backend
3. Vérifier que Tesseract et Poppler sont installés
4. Vérifier les permissions Gmail (mot de passe d'application)

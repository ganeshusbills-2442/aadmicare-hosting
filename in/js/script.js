// =====================================================================
// AadmiCare — Site Behaviour
// Loads the Inquiry / Member-Registration / Customer-Registration
// modules from /modules and wires up modals + form submissions.
// Endpoint URLs come from js/config.js (window.AADMICARE_CONFIG).
// =====================================================================
(function () {
  const CFG = window.AADMICARE_CONFIG || {};

  // ---------- Module loader ----------
  // Fetches an HTML fragment and injects it into the given mount point.
  function loadModule(url, mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return Promise.resolve();

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + url);
        return res.text();
      })
      .then(function (html) {
        mount.innerHTML = html;
      })
      .catch(function (err) {
        console.error('AadmiCare module load error:', err);
        mount.innerHTML =
          '<p style="text-align:center;color:#d9534f;padding:20px;">' +
          'This section could not be loaded. Please refresh the page.</p>';
      });
  }

  // ---------- Modal Control (global, used by onclick in index.html) ----------
  window.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  };

  window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  };

  // Close modal on background click (works for modals injected later too,
  // since this is a delegated listener on window, not the modal itself)
  window.addEventListener('click', function (event) {
    if (event.target.classList && event.target.classList.contains('modal-overlay')) {
      event.target.style.display = 'none';
    }
  });

  // ---------- Helper: submit a form's data to a Google Sheet endpoint ----------
  function submitToGoogleSheet(url, payload, btnId, responseId, successMsg, formId, modalId) {
    const btn = document.getElementById(btnId);
    const resDiv = document.getElementById(responseId);
    if (!btn || !resDiv) return;

    btn.innerText = 'Submitting...';
    btn.disabled = true;

    // Send payload as text/plain to prevent Google Apps Script from dropping the POST body
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function () {
        resDiv.style.color = '#0F8A3C';
        resDiv.innerText = successMsg;
        resDiv.style.display = 'block';
        if (formId) document.getElementById(formId).reset();

        // If this form lives inside a modal, show the success message briefly,
        // then close the modal and return to the main page.
        if (modalId) {
          setTimeout(function () {
            closeModal(modalId);
            resDiv.style.display = 'none';
          }, 1500);
        }
      })
      .catch(function () {
        resDiv.style.color = '#d9534f';
        resDiv.innerText = 'An error occurred. Please try again.';
        resDiv.style.display = 'block';
      })
      .finally(function () {
        btn.innerText = 'Submitted';
        btn.disabled = false;
      });
  }

  // ---------- Wire up each form once its module has been injected ----------
  function initInquiryForm() {
    const form = document.getElementById('inquiryForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value
      };
      submitToGoogleSheet(
        CFG.INQUIRY_SCRIPT_URL, payload,
        'inquirySubmitBtn', 'inquiryResponse',
        '✓ Inquiry received! We will contact you soon.',
        'inquiryForm'
      );
    });
  }

  function initMemberForm() {
    const form = document.getElementById('memberForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const payload = {
        fullName: document.getElementById('mFullName').value,
        age: document.getElementById('mAge').value,
        gender: document.getElementById('mGender').value,
        phone: document.getElementById('mPhone').value,
        role: document.getElementById('mRole').value,
        address: document.getElementById('mAddress').value
      };
      submitToGoogleSheet(
        CFG.MEMBER_SCRIPT_URL, payload,
        'memberSubmitBtn', 'memberResponse',
        '✓ Member registration successful!',
        'memberForm', 'memberModal'
      );
    });
  }

  function initCustomerForm() {
    const form = document.getElementById('customerForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const payload = {
        fullName: document.getElementById('cFullName').value,
        phone: document.getElementById('cPhone').value,
        email: document.getElementById('cEmail').value,
        city: document.getElementById('cCity').value,
        preferredService: document.getElementById('cService').value
      };
      submitToGoogleSheet(
        CFG.CUSTOMER_SCRIPT_URL, payload,
        'customerSubmitBtn', 'customerResponse',
        '✓ Customer account created!',
        'customerForm', 'customerModal'
      );
    });
  }

  // ---------- Boot: load all 3 modules, then attach their form handlers ----------
  document.addEventListener('DOMContentLoaded', function () {
    loadModule('modules/inquiry-form.html', 'inquiry-form-mount').then(initInquiryForm);
    loadModule('modules/member-registration.html', 'member-modal-mount').then(initMemberForm);
    loadModule('modules/customer-registration.html', 'customer-modal-mount').then(initCustomerForm);
  });
})();

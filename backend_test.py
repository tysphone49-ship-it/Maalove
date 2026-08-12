#!/usr/bin/env python3
"""
Backend API Testing Script for Maalove
Tests the NEW PROCESS CHANGE: men are NO LONGER auto-activated; every user needs admin validation
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL
BASE_URL = "https://euro-africa-match.preview.emergentagent.com/api"

# Admin credentials
ADMIN_EMAIL = "admin@maalove.com"
ADMIN_PASSWORD = "admin123"

# Test data
HOMME_EMAIL = f"admin_validation_homme_{datetime.now().timestamp()}@test.com"
FEMME_EMAIL = f"regression_femme_{datetime.now().timestamp()}@test.com"

# Base64 test images
PHOTO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
SELFIE_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA=="
VIDEO_BASE64 = "data:video/webm;base64,GkXfo0A"

def print_test(step, description):
    """Print test step header"""
    print(f"\n{'='*80}")
    print(f"STEP {step}: {description}")
    print('='*80)

def print_result(success, message, status_code=None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    if status_code:
        print(f"{status} [HTTP {status_code}] {message}")
    else:
        print(f"{status} {message}")

def test_step_1_seed():
    """Step 1: POST /api/seed"""
    print_test(1, "POST /api/seed")
    try:
        response = requests.post(f"{BASE_URL}/seed")
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print_result(True, "Seed endpoint returned {ok:true}", response.status_code)
                return True
            else:
                print_result(False, f"Unexpected response: {data}", response.status_code)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}", response.status_code)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_2_register_homme():
    """Step 2: Register HOMME -> status should be 'en_attente'"""
    print_test(2, "Register HOMME (unique email) -> status 'en_attente'")
    try:
        payload = {
            "email": HOMME_EMAIL,
            "password": "pass1234",
            "prenom": "ValidHomme",
            "genre": "homme",
            "age": 33,
            "ville": "Lyon",
            "pays": "France"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user = data.get('user')
            
            if not token or not user:
                print_result(False, f"Missing token or user in response: {data}", response.status_code)
                return None
            
            if user.get('status') == 'en_attente':
                print_result(True, f"HOMME registered with status 'en_attente', token: {token[:20]}...", response.status_code)
                return token
            else:
                print_result(False, f"Expected status 'en_attente', got '{user.get('status')}'", response.status_code)
                return None
        else:
            print_result(False, f"Expected 200, got {response.status_code}: {response.text}", response.status_code)
            return None
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return None

def test_step_3_discover_pending(token):
    """Step 3: GET /api/discover as homme (pending) -> MUST return 403"""
    print_test(3, "GET /api/discover as homme (status en_attente) -> MUST return HTTP 403 (pending)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/discover", headers=headers)
        
        if response.status_code == 403:
            data = response.json()
            print_result(True, f"Correctly returned 403 (pending): {data}", response.status_code)
            return True
        else:
            print_result(False, f"Expected 403, got {response.status_code}: {response.text}", response.status_code)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_4_submit_selfie(token):
    """Step 4: POST /api/verification/selfie -> 200; GET /api/me must show status == 'en_verification' (NOT 'verifie')"""
    print_test(4, "POST /api/verification/selfie -> 200; GET /api/me must show status == 'en_verification' (NOT 'verifie')")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "photo": PHOTO_BASE64,
            "selfie": SELFIE_BASE64
        }
        response = requests.post(f"{BASE_URL}/verification/selfie", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user')
            
            if not user:
                print_result(False, f"Missing user in response: {data}", response.status_code)
                return False
            
            # CRITICAL: Status must be 'en_verification' (NOT 'verifie')
            if user.get('status') != 'en_verification':
                print_result(False, f"Expected status 'en_verification', got '{user.get('status')}'", response.status_code)
                return False
            
            # Verify selfie is present
            if not user.get('selfie'):
                print_result(False, f"Selfie field is empty in user object", response.status_code)
                return False
            
            print_result(True, f"Selfie uploaded successfully, status changed to 'en_verification' (NOT 'verifie'), selfie present", response.status_code)
            
            # Double-check with GET /api/me
            me_response = requests.get(f"{BASE_URL}/me", headers=headers)
            if me_response.status_code == 200:
                me_data = me_response.json()
                me_user = me_data.get('user')
                if me_user.get('status') == 'en_verification':
                    print(f"   ✅ GET /api/me confirms: status='en_verification', selfie={'present' if me_user.get('selfie') else 'missing'}")
                else:
                    print_result(False, f"GET /api/me shows wrong status: '{me_user.get('status')}' (expected 'en_verification')", me_response.status_code)
                    return False
            
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}: {response.text}", response.status_code)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_5_discover_still_blocked(token):
    """Step 5: GET /api/discover as homme again -> MUST STILL return 403 (not yet validated by admin)"""
    print_test(5, "GET /api/discover as homme (status en_verification) -> MUST STILL return HTTP 403 (not yet validated by admin)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/discover", headers=headers)
        
        if response.status_code == 403:
            data = response.json()
            print_result(True, f"Correctly STILL returned 403 (pending admin validation): {data}", response.status_code)
            return True
        else:
            print_result(False, f"Expected 403, got {response.status_code}: {response.text}", response.status_code)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_6_admin_verifications(homme_token):
    """Step 6: Admin GET /api/admin/verifications -> the homme must appear (status en_verification, non-empty selfie)"""
    print_test(6, "Admin GET /api/admin/verifications -> homme must appear (status en_verification, non-empty selfie)")
    
    # First, admin login
    try:
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code != 200:
            print_result(False, f"Admin login failed: {response.status_code}", response.status_code)
            return None
        
        data = response.json()
        admin_token = data.get('token')
        print(f"   ✅ Admin logged in successfully")
        
    except Exception as e:
        print_result(False, f"Admin login exception: {str(e)}")
        return None
    
    # Get homme user ID
    try:
        me_response = requests.get(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {homme_token}"})
        if me_response.status_code != 200:
            print_result(False, f"Could not get homme user ID", me_response.status_code)
            return None
        
        homme_user = me_response.json().get('user')
        homme_id = homme_user.get('id')
        
    except Exception as e:
        print_result(False, f"Exception getting homme ID: {str(e)}")
        return None
    
    # Admin GET /api/admin/verifications
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/admin/verifications", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            
            # Find the homme in the list
            homme_in_list = None
            for u in users:
                if u.get('id') == homme_id:
                    homme_in_list = u
                    break
            
            if not homme_in_list:
                print_result(False, f"Homme NOT found in admin verifications list (expected to be there)", response.status_code)
                return None
            
            # Check status is 'en_verification'
            if homme_in_list.get('status') != 'en_verification':
                print_result(False, f"Homme status is '{homme_in_list.get('status')}' (expected 'en_verification')", response.status_code)
                return None
            
            # Check selfie is non-empty
            if not homme_in_list.get('selfie'):
                print_result(False, f"Homme selfie is empty in admin verifications list", response.status_code)
                return None
            
            print_result(True, f"Homme appears in admin verifications list with status 'en_verification' and non-empty selfie", response.status_code)
            return admin_token
            
        else:
            print_result(False, f"Expected 200, got {response.status_code}: {response.text}", response.status_code)
            return None
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return None

def test_step_7_admin_verify(admin_token, homme_token):
    """Step 7: Admin POST /api/admin/verify {userId, decision:'verifie'} -> GET /api/me shows status 'verifie'"""
    print_test(7, "Admin POST /api/admin/verify {userId, decision:'verifie'} -> GET /api/me shows status 'verifie'")
    
    # Get homme user ID
    try:
        me_response = requests.get(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {homme_token}"})
        if me_response.status_code != 200:
            print_result(False, f"Could not get homme user ID", me_response.status_code)
            return False
        
        homme_user = me_response.json().get('user')
        homme_id = homme_user.get('id')
        
    except Exception as e:
        print_result(False, f"Exception getting homme ID: {str(e)}")
        return False
    
    # Admin verify
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        payload = {
            "userId": homme_id,
            "decision": "verifie"
        }
        response = requests.post(f"{BASE_URL}/admin/verify", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if not data.get('ok'):
                print_result(False, f"Unexpected response: {data}", response.status_code)
                return False
            
            print(f"   ✅ Admin verified user successfully")
            
            # Verify status changed to 'verifie'
            me_check = requests.get(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {homme_token}"})
            if me_check.status_code == 200:
                final_user = me_check.json().get('user')
                if final_user.get('status') == 'verifie':
                    print_result(True, f"GET /api/me confirms: status='verifie'", me_check.status_code)
                    return True
                else:
                    print_result(False, f"Status not updated to 'verifie', got '{final_user.get('status')}'", me_check.status_code)
                    return False
            else:
                print_result(False, f"GET /api/me failed: {me_check.status_code}", me_check.status_code)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}: {response.text}", response.status_code)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_8_discover_now_works(token):
    """Step 8: GET /api/discover as homme -> NOW expect HTTP 200 with femme profiles"""
    print_test(8, "GET /api/discover as homme (status verifie) -> NOW expect HTTP 200 with femme profiles")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/discover", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            profiles = data.get('profiles', [])
            print_result(True, f"Discover NOW works! Returned {len(profiles)} profiles", response.status_code)
            
            # Check if profiles are femmes
            femme_count = sum(1 for p in profiles if p.get('genre') == 'femme')
            print(f"   Found {femme_count} femme profiles out of {len(profiles)} total")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}: {response.text}", response.status_code)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_9_women_flow_regression():
    """Step 9: Regression test - women double-validation flow"""
    print_test(9, "REGRESSION: Women flow (register -> documents_requis -> submit docs -> en_verification -> admin verify -> verifie)")
    
    all_passed = True
    
    # 9a: Register FEMME -> status 'documents_requis'
    print("\n   9a: Register FEMME -> status 'documents_requis'")
    try:
        payload = {
            "email": FEMME_EMAIL,
            "password": "pass1234",
            "prenom": "RegressionFemme",
            "genre": "femme",
            "age": 28,
            "ville": "Douala",
            "pays": "Cameroun"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            femme_token = data.get('token')
            user = data.get('user')
            
            if user.get('status') == 'documents_requis':
                print_result(True, f"FEMME registered with status 'documents_requis'", response.status_code)
            else:
                print_result(False, f"Expected status 'documents_requis', got '{user.get('status')}'", response.status_code)
                all_passed = False
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}", response.status_code)
            all_passed = False
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    # 9b: POST /api/verification/documents with all required fields
    print("\n   9b: POST /api/verification/documents -> status 'en_verification'")
    try:
        headers = {"Authorization": f"Bearer {femme_token}"}
        payload = {
            "pieceIdentite": PHOTO_BASE64,
            "moyenPaiement": "MoMo Money",
            "referencePaiement": "MP7",
            "videoPresentation": VIDEO_BASE64,
            "phraseVideo": "test"
        }
        response = requests.post(f"{BASE_URL}/verification/documents", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user')
            
            if user.get('status') == 'en_verification':
                print_result(True, f"Documents submitted, status changed to 'en_verification'", response.status_code)
            else:
                print_result(False, f"Expected status 'en_verification', got '{user.get('status')}'", response.status_code)
                all_passed = False
        else:
            print_result(False, f"Expected 200, got {response.status_code}: {response.text}", response.status_code)
            all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    # 9c: Admin login
    print("\n   9c: Admin login")
    try:
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            admin_token = data.get('token')
            print_result(True, f"Admin logged in successfully", response.status_code)
        else:
            print_result(False, f"Expected 200, got {response.status_code}", response.status_code)
            all_passed = False
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    # 9d: Admin verify user
    print("\n   9d: Admin POST /api/admin/verify with decision 'verifie'")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get the user ID from /me endpoint using femme token
        me_response = requests.get(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {femme_token}"})
        if me_response.status_code == 200:
            femme_user = me_response.json().get('user')
            femme_id = femme_user.get('id')
            
            payload = {
                "userId": femme_id,
                "decision": "verifie"
            }
            response = requests.post(f"{BASE_URL}/admin/verify", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok'):
                    print_result(True, f"Admin verified user successfully", response.status_code)
                    
                    # Verify status changed to 'verifie'
                    me_check = requests.get(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {femme_token}"})
                    if me_check.status_code == 200:
                        final_user = me_check.json().get('user')
                        if final_user.get('status') == 'verifie':
                            print(f"   GET /api/me confirms: status='verifie'")
                        else:
                            print_result(False, f"Status not updated to 'verifie', got '{final_user.get('status')}'", me_check.status_code)
                            all_passed = False
                else:
                    print_result(False, f"Unexpected response: {data}", response.status_code)
                    all_passed = False
            else:
                print_result(False, f"Expected 200, got {response.status_code}: {response.text}", response.status_code)
                all_passed = False
        else:
            print_result(False, f"Could not get femme user ID", me_response.status_code)
            all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_step_10_conversations_no_500(token):
    """Step 10: No 500 on /api/conversations"""
    print_test(10, "No 500 on /api/conversations")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/conversations", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            conversations = data.get('conversations', [])
            print_result(True, f"Conversations endpoint working correctly (no 500), returned {len(conversations)} conversations", response.status_code)
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}: {response.text}", response.status_code)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("MAALOVE BACKEND API TESTING")
    print("Testing: PROCESS CHANGE - men are NO LONGER auto-activated; every user needs admin validation")
    print("="*80)
    
    results = {}
    
    # Step 1: Seed
    results['step1'] = test_step_1_seed()
    
    # Step 2: Register HOMME -> status 'en_attente'
    homme_token = test_step_2_register_homme()
    results['step2'] = homme_token is not None
    
    if not homme_token:
        print("\n❌ Cannot continue without homme token")
        sys.exit(1)
    
    # Step 3: Discover as homme (pending) -> 403
    results['step3'] = test_step_3_discover_pending(homme_token)
    
    # Step 4: Submit selfie -> status 'en_verification' (NOT 'verifie')
    results['step4'] = test_step_4_submit_selfie(homme_token)
    
    # Step 5: Discover as homme (still pending) -> STILL 403
    results['step5'] = test_step_5_discover_still_blocked(homme_token)
    
    # Step 6: Admin GET /admin/verifications -> homme appears
    admin_token = test_step_6_admin_verifications(homme_token)
    results['step6'] = admin_token is not None
    
    if not admin_token:
        print("\n❌ Cannot continue without admin token")
        sys.exit(1)
    
    # Step 7: Admin verify -> status 'verifie'
    results['step7'] = test_step_7_admin_verify(admin_token, homme_token)
    
    # Step 8: Discover as homme (verified) -> NOW 200
    results['step8'] = test_step_8_discover_now_works(homme_token)
    
    # Step 9: Women flow regression
    results['step9'] = test_step_9_women_flow_regression()
    
    # Step 10: No 500 on /api/conversations
    results['step10'] = test_step_10_conversations_no_500(homme_token)
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    for step, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {step}")
    
    print(f"\nTotal: {total} tests | Passed: {passed} | Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()

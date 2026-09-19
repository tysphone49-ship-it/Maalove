#!/usr/bin/env python3
"""
Backend API Testing for Maalove
Tests the CHANGE: videoPresentation is NO LONGER required for femmes in /api/verification/documents
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from .env
BASE_URL = "https://euro-africa-match.preview.emergentagent.com/api"

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def test_step(step_num, description):
    print(f"\n{'='*80}")
    print(f"STEP {step_num}: {description}")
    print('='*80)

def main():
    try:
        # STEP 1: POST /api/seed
        test_step(1, "POST /api/seed")
        resp = requests.post(f"{BASE_URL}/seed", timeout=10)
        log(f"POST /api/seed -> HTTP {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            log(f"✅ Response: {data}")
            if data.get('ok'):
                log("✅ PASS: Seed endpoint working")
            else:
                log("❌ FAIL: Seed response missing 'ok' field")
                return False
        else:
            log(f"❌ FAIL: Expected HTTP 200, got {resp.status_code}")
            return False

        # STEP 2: Register FEMME (unique email)
        test_step(2, "Register FEMME (unique email)")
        femme_email = f"femme_video_removed_{datetime.now().timestamp()}@maalove.test"
        femme_data = {
            "email": femme_email,
            "password": "test1234",
            "prenom": "VideoRemovedFemme",
            "genre": "femme",
            "age": 28,
            "ville": "Douala",
            "pays": "Cameroun",
            "photo": "https://images.unsplash.com/photo-1534470717-233b39a41c54?w=400"
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=femme_data, timeout=10)
        log(f"POST /api/auth/register -> HTTP {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            femme_token = data.get('token')
            femme_id = data.get('user', {}).get('id')
            status = data.get('user', {}).get('status')
            log(f"✅ Femme registered: id={femme_id}, status={status}")
            if status == 'documents_requis':
                log("✅ PASS: Femme status correctly set to 'documents_requis'")
            else:
                log(f"❌ FAIL: Expected status 'documents_requis', got '{status}'")
                return False
        else:
            log(f"❌ FAIL: Expected HTTP 200, got {resp.status_code}")
            log(f"Response: {resp.text}")
            return False

        # STEP 3: POST /api/verification/documents with NO video and NO pieceIdentite
        test_step(3, "POST /api/verification/documents (NO video, NO pieceIdentite)")
        docs_data = {
            "moyenPaiement": "MoMo Money",
            "referencePaiement": "MP99",
            "forfaitMois": 6,
            "forfaitCoach": True,
            "forfaitMontant": 90000
        }
        headers = {"Authorization": f"Bearer {femme_token}"}
        resp = requests.post(f"{BASE_URL}/verification/documents", json=docs_data, headers=headers, timeout=10)
        log(f"POST /api/verification/documents -> HTTP {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            log(f"✅ Response: {json.dumps(data, indent=2)}")
            log("✅ PASS: Documents submitted successfully WITHOUT video and WITHOUT pieceIdentite")
            
            # Verify status changed to 'en_verification'
            resp_me = requests.get(f"{BASE_URL}/me", headers=headers, timeout=10)
            log(f"GET /api/me -> HTTP {resp_me.status_code}")
            if resp_me.status_code == 200:
                me_data = resp_me.json()
                me_status = me_data.get('user', {}).get('status')
                log(f"Current status: {me_status}")
                if me_status == 'en_verification':
                    log("✅ PASS: Status correctly changed to 'en_verification'")
                else:
                    log(f"❌ FAIL: Expected status 'en_verification', got '{me_status}'")
                    return False
            else:
                log(f"❌ FAIL: GET /api/me returned HTTP {resp_me.status_code}")
                return False
        else:
            log(f"❌ FAIL: Expected HTTP 200, got {resp.status_code}")
            log(f"Response: {resp.text}")
            return False

        # STEP 4a: Negative test - empty payload
        test_step("4a", "NEGATIVE TEST: POST /api/verification/documents with empty payload {}")
        femme2_email = f"femme_negative1_{datetime.now().timestamp()}@maalove.test"
        femme2_data = {
            "email": femme2_email,
            "password": "test1234",
            "prenom": "NegativeFemme1",
            "genre": "femme",
            "age": 25,
            "ville": "Yaounde"
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=femme2_data, timeout=10)
        if resp.status_code == 200:
            femme2_token = resp.json().get('token')
            headers2 = {"Authorization": f"Bearer {femme2_token}"}
            
            # Try to submit with empty payload
            resp = requests.post(f"{BASE_URL}/verification/documents", json={}, headers=headers2, timeout=10)
            log(f"POST /api/verification/documents (empty payload) -> HTTP {resp.status_code}")
            if resp.status_code == 400:
                error_msg = resp.json().get('error', '')
                log(f"✅ PASS: Correctly rejected with HTTP 400")
                log(f"Error message: {error_msg}")
            else:
                log(f"❌ FAIL: Expected HTTP 400, got {resp.status_code}")
                return False
        else:
            log(f"❌ FAIL: Could not register femme2 for negative test")
            return False

        # STEP 4b: Negative test - only moyenPaiement, no ref/preuve
        test_step("4b", "NEGATIVE TEST: POST /api/verification/documents with only moyenPaiement")
        femme3_email = f"femme_negative2_{datetime.now().timestamp()}@maalove.test"
        femme3_data = {
            "email": femme3_email,
            "password": "test1234",
            "prenom": "NegativeFemme2",
            "genre": "femme",
            "age": 26,
            "ville": "Douala"
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=femme3_data, timeout=10)
        if resp.status_code == 200:
            femme3_token = resp.json().get('token')
            headers3 = {"Authorization": f"Bearer {femme3_token}"}
            
            # Try to submit with only moyenPaiement
            resp = requests.post(f"{BASE_URL}/verification/documents", json={"moyenPaiement": "Orange Money"}, headers=headers3, timeout=10)
            log(f"POST /api/verification/documents (only moyenPaiement) -> HTTP {resp.status_code}")
            if resp.status_code == 400:
                error_msg = resp.json().get('error', '')
                log(f"✅ PASS: Correctly rejected with HTTP 400")
                log(f"Error message: {error_msg}")
            else:
                log(f"❌ FAIL: Expected HTTP 400, got {resp.status_code}")
                return False
        else:
            log(f"❌ FAIL: Could not register femme3 for negative test")
            return False

        # STEP 5: Admin GET /api/admin/verifications
        test_step(5, "Admin GET /api/admin/verifications")
        # Login as admin
        admin_login = {"email": "admin@maalove.com", "password": "admin123"}
        resp = requests.post(f"{BASE_URL}/auth/login", json=admin_login, timeout=10)
        log(f"POST /api/auth/login (admin) -> HTTP {resp.status_code}")
        if resp.status_code == 200:
            admin_token = resp.json().get('token')
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            
            # Get verifications list
            resp = requests.get(f"{BASE_URL}/admin/verifications", headers=admin_headers, timeout=10)
            log(f"GET /api/admin/verifications -> HTTP {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                users = data.get('users', [])
                log(f"Found {len(users)} users in verification queue")
                
                # Find our femme
                femme_found = None
                for u in users:
                    if u.get('id') == femme_id:
                        femme_found = u
                        break
                
                if femme_found:
                    log(f"✅ Femme found in verification list")
                    log(f"forfaitMois: {femme_found.get('forfaitMois')}")
                    log(f"forfaitCoach: {femme_found.get('forfaitCoach')}")
                    log(f"forfaitMontant: {femme_found.get('forfaitMontant')}")
                    
                    if (femme_found.get('forfaitMois') == 6 and 
                        femme_found.get('forfaitCoach') == True and 
                        femme_found.get('forfaitMontant') == 90000):
                        log("✅ PASS: All forfait fields correct (forfaitMois==6, forfaitCoach==true, forfaitMontant==90000)")
                    else:
                        log(f"❌ FAIL: Forfait fields mismatch")
                        return False
                else:
                    log(f"❌ FAIL: Femme not found in verification list")
                    return False
            else:
                log(f"❌ FAIL: Expected HTTP 200, got {resp.status_code}")
                return False
        else:
            log(f"❌ FAIL: Admin login failed with HTTP {resp.status_code}")
            return False

        # STEP 6: REGRESSION - Men selfie flow
        test_step(6, "REGRESSION: Men selfie flow (register -> selfie -> en_verification -> admin verify -> verifie -> discover 200)")
        
        # Register homme
        homme_email = f"homme_regression_{datetime.now().timestamp()}@maalove.test"
        homme_data = {
            "email": homme_email,
            "password": "test1234",
            "prenom": "RegressionHomme",
            "genre": "homme",
            "age": 35,
            "ville": "Paris",
            "pays": "France",
            "photo": "https://images.unsplash.com/photo-1600603406200-5b2a104684ac?w=400"
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=homme_data, timeout=10)
        log(f"POST /api/auth/register (homme) -> HTTP {resp.status_code}")
        if resp.status_code == 200:
            homme_token = resp.json().get('token')
            homme_id = resp.json().get('user', {}).get('id')
            homme_status = resp.json().get('user', {}).get('status')
            log(f"✅ Homme registered: id={homme_id}, status={homme_status}")
            
            if homme_status != 'en_attente':
                log(f"❌ FAIL: Expected status 'en_attente', got '{homme_status}'")
                return False
            
            homme_headers = {"Authorization": f"Bearer {homme_token}"}
            
            # Try discover before selfie (should be 403)
            resp = requests.get(f"{BASE_URL}/discover", headers=homme_headers, timeout=10)
            log(f"GET /api/discover (before selfie) -> HTTP {resp.status_code}")
            if resp.status_code == 403:
                log("✅ PASS: Discover correctly blocked before selfie")
            else:
                log(f"❌ FAIL: Expected HTTP 403, got {resp.status_code}")
                return False
            
            # Submit selfie
            selfie_data = {
                "photo": "https://images.unsplash.com/photo-1600603406200-5b2a104684ac?w=400",
                "selfie": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
            }
            resp = requests.post(f"{BASE_URL}/verification/selfie", json=selfie_data, headers=homme_headers, timeout=10)
            log(f"POST /api/verification/selfie -> HTTP {resp.status_code}")
            if resp.status_code == 200:
                log("✅ Selfie submitted successfully")
                
                # Check status changed to en_verification
                resp_me = requests.get(f"{BASE_URL}/me", headers=homme_headers, timeout=10)
                if resp_me.status_code == 200:
                    homme_status = resp_me.json().get('user', {}).get('status')
                    log(f"Status after selfie: {homme_status}")
                    if homme_status != 'en_verification':
                        log(f"❌ FAIL: Expected status 'en_verification', got '{homme_status}'")
                        return False
                else:
                    log(f"❌ FAIL: GET /api/me failed")
                    return False
                
                # Try discover after selfie but before admin verify (should still be 403)
                resp = requests.get(f"{BASE_URL}/discover", headers=homme_headers, timeout=10)
                log(f"GET /api/discover (after selfie, before admin verify) -> HTTP {resp.status_code}")
                if resp.status_code == 403:
                    log("✅ PASS: Discover still blocked before admin verification")
                else:
                    log(f"❌ FAIL: Expected HTTP 403, got {resp.status_code}")
                    return False
                
                # Admin verify
                verify_data = {"userId": homme_id, "decision": "verifie"}
                resp = requests.post(f"{BASE_URL}/admin/verify", json=verify_data, headers=admin_headers, timeout=10)
                log(f"POST /api/admin/verify -> HTTP {resp.status_code}")
                if resp.status_code == 200:
                    log("✅ Admin verified homme")
                    
                    # Check status changed to verifie
                    resp_me = requests.get(f"{BASE_URL}/me", headers=homme_headers, timeout=10)
                    if resp_me.status_code == 200:
                        homme_status = resp_me.json().get('user', {}).get('status')
                        log(f"Status after admin verify: {homme_status}")
                        if homme_status != 'verifie':
                            log(f"❌ FAIL: Expected status 'verifie', got '{homme_status}'")
                            return False
                    else:
                        log(f"❌ FAIL: GET /api/me failed")
                        return False
                    
                    # Try discover after admin verify (should be 200)
                    resp = requests.get(f"{BASE_URL}/discover", headers=homme_headers, timeout=10)
                    log(f"GET /api/discover (after admin verify) -> HTTP {resp.status_code}")
                    if resp.status_code == 200:
                        profiles = resp.json().get('profiles', [])
                        log(f"✅ PASS: Discover unlocked, found {len(profiles)} profiles")
                    else:
                        log(f"❌ FAIL: Expected HTTP 200, got {resp.status_code}")
                        return False
                else:
                    log(f"❌ FAIL: Admin verify failed with HTTP {resp.status_code}")
                    return False
            else:
                log(f"❌ FAIL: Selfie submission failed with HTTP {resp.status_code}")
                return False
        else:
            log(f"❌ FAIL: Homme registration failed with HTTP {resp.status_code}")
            return False

        # STEP 6b: REGRESSION - GET /api/conversations (no 500)
        test_step("6b", "REGRESSION: GET /api/conversations (no 500 errors)")
        for i in range(3):
            resp = requests.get(f"{BASE_URL}/conversations", headers=homme_headers, timeout=10)
            log(f"GET /api/conversations (attempt {i+1}) -> HTTP {resp.status_code}")
            if resp.status_code == 200:
                log(f"✅ PASS: Conversations endpoint working (attempt {i+1})")
            else:
                log(f"❌ FAIL: Expected HTTP 200, got {resp.status_code}")
                return False

        # ALL TESTS PASSED
        print("\n" + "="*80)
        print("✅ ALL TESTS PASSED (100% SUCCESS RATE)")
        print("="*80)
        print("\nSUMMARY:")
        print("✅ Step 1: POST /api/seed -> HTTP 200")
        print("✅ Step 2: Register FEMME -> HTTP 200, status='documents_requis'")
        print("✅ Step 3: POST /api/verification/documents (NO video, NO pieceIdentite) -> HTTP 200, status='en_verification'")
        print("✅ Step 4a: NEGATIVE TEST (empty payload) -> HTTP 400")
        print("✅ Step 4b: NEGATIVE TEST (only moyenPaiement) -> HTTP 400")
        print("✅ Step 5: Admin GET /api/admin/verifications -> HTTP 200, forfait fields correct")
        print("✅ Step 6: REGRESSION Men selfie flow -> All steps passed (register -> selfie -> en_verification -> admin verify -> verifie -> discover 200)")
        print("✅ Step 6b: REGRESSION GET /api/conversations -> HTTP 200 (no 500 errors)")
        print("\n✅ CHANGE CONFIRMED: videoPresentation is NO LONGER required for femmes")
        print("✅ CHANGE CONFIRMED: pieceIdentite is NO LONGER required for femmes")
        print("✅ All validation rules working correctly")
        print("✅ All regression tests passed")
        return True

    except Exception as e:
        log(f"❌ EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

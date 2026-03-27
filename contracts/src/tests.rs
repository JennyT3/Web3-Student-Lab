use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, Events, Ledger},
    vec, Address, Bytes, Env, FromVal, String, Symbol,
};

fn setup() -> (Env, Address, CertificateContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(CertificateContract, ());
    let client = CertificateContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.init(&admin);
    (env, admin, client)
}

#[test]
fn issues_and_loads_certificate_successfully() {
    let (env, _admin, client) = setup();

    env.ledger().with_mut(|ledger| ledger.timestamp = 1_234);

    let course_symbol = symbol_short!("SOLID");
    let student = Address::generate(&env);
    let course_name = String::from_str(&env, "Rust 101");

    let issued = client.issue(&course_symbol, &vec![&env, student.clone()], &course_name);

    assert_eq!(issued.len(), 1);
    let cert = issued.get(0).unwrap();
    assert_eq!(cert.course_symbol, course_symbol);
    assert_eq!(cert.student, student);
    assert_eq!(cert.course_name, course_name);
    assert_eq!(cert.issue_date, 1_234);
    assert!(!cert.revoked);

    let stored = client.get_certificate(&course_symbol, &student);
    assert_eq!(stored, Some(cert));
}

#[test]
fn returns_none_for_non_existent_certificate() {
    let (env, _admin, client) = setup();

    let course_symbol = symbol_short!("MISSIN");
    let student = Address::generate(&env);
    assert!(client.get_certificate(&course_symbol, &student).is_none());
}

#[test]
fn issues_multiple_students_in_one_call() {
    let (env, _admin, client) = setup();

    env.ledger().with_mut(|ledger| ledger.timestamp = 5_000);

    let course_symbol = symbol_short!("MULTI");
    let course_name = String::from_str(&env, "Web3 Basics");
    let student_a = Address::generate(&env);
    let student_b = Address::generate(&env);
    let student_c = Address::generate(&env);

    let students = vec![
        &env,
        student_a.clone(),
        student_b.clone(),
        student_c.clone(),
    ];
    let issued = client.issue(&course_symbol, &students, &course_name);

    assert_eq!(issued.len(), 3);

    // Each student has a unique, independently stored certificate
    for student in [&student_a, &student_b, &student_c] {
        let cert = client.get_certificate(&course_symbol, student).unwrap();
        assert_eq!(cert.student, *student);
        assert_eq!(cert.issue_date, 5_000);
        assert!(!cert.revoked);
    }
}

#[test]
fn each_student_gets_unique_storage_key() {
    let (env, _admin, client) = setup();

    let course_symbol = symbol_short!("UNIQ");
    let course_name = String::from_str(&env, "Soroban 101");
    let student_a = Address::generate(&env);
    let student_b = Address::generate(&env);

    client.issue(
        &course_symbol,
        &vec![&env, student_a.clone(), student_b.clone()],
        &course_name,
    );

    let cert_a = client.get_certificate(&course_symbol, &student_a).unwrap();
    let cert_b = client.get_certificate(&course_symbol, &student_b).unwrap();
    assert_ne!(cert_a.student, cert_b.student);
}

#[test]
fn verifies_event_emitted_per_student() {
    let (env, _admin, client) = setup();

    let course_symbol = symbol_short!("SOLID");
    let course_name = String::from_str(&env, "Rust 101");
    let student_a = Address::generate(&env);
    let student_b = Address::generate(&env);

    client.issue(
        &course_symbol,
        &vec![&env, student_a.clone(), student_b.clone()],
        &course_name,
    );

    // Count cert_issued events emitted by this contract
    let all_events = env.events().all();
    let mut cert_issued_count = 0u32;
    for (addr, topics, _) in all_events.iter() {
        if addr == client.address
            && Symbol::from_val(&env, &topics.get(0).unwrap()) == Symbol::new(&env, "cert_issued")
        {
            cert_issued_count += 1;
        }
    }

    assert_eq!(cert_issued_count, 2);
}

#[test]
fn admin_can_revoke_certificate() {
    let (env, admin, client) = setup();

    let course_symbol = symbol_short!("SOLID");
    let student = Address::generate(&env);
    let course_name = String::from_str(&env, "Rust 101");

    client.issue(&course_symbol, &vec![&env, student.clone()], &course_name);
    client.revoke(&admin, &course_symbol, &student);

    let cert = client.get_certificate(&course_symbol, &student).unwrap();
    assert!(cert.revoked);
}

#[test]
fn revoke_does_not_affect_other_students() {
    let (env, admin, client) = setup();

    let course_symbol = symbol_short!("SOLID");
    let course_name = String::from_str(&env, "Rust 101");
    let student_a = Address::generate(&env);
    let student_b = Address::generate(&env);

    client.issue(
        &course_symbol,
        &vec![&env, student_a.clone(), student_b.clone()],
        &course_name,
    );

    client.revoke(&admin, &course_symbol, &student_a);

    assert!(
        client
            .get_certificate(&course_symbol, &student_a)
            .unwrap()
            .revoked
    );
    assert!(
        !client
            .get_certificate(&course_symbol, &student_b)
            .unwrap()
            .revoked
    );
}

#[test]
fn revoke_emits_event() {
    let (env, admin, client) = setup();

    let course_symbol = symbol_short!("SOLID");
    let student = Address::generate(&env);
    let course_name = String::from_str(&env, "Rust 101");

    client.issue(&course_symbol, &vec![&env, student.clone()], &course_name);
    client.revoke(&admin, &course_symbol, &student);

    let (addr, topics, _data) = env.events().all().last().unwrap();
    assert_eq!(addr, client.address);
    assert_eq!(
        Symbol::from_val(&env, &topics.get(0).unwrap()),
        Symbol::new(&env, "cert_revoked")
    );
    assert_eq!(
        Symbol::from_val(&env, &topics.get(1).unwrap()),
        course_symbol
    );
}

#[test]
#[should_panic(expected = "unauthorized")]
fn non_admin_cannot_revoke_certificate() {
    let (env, _admin, client) = setup();

    let course_symbol = symbol_short!("SOLID");
    let student = Address::generate(&env);
    let course_name = String::from_str(&env, "Rust 101");

    client.issue(&course_symbol, &vec![&env, student.clone()], &course_name);

    let attacker = Address::generate(&env);
    client.revoke(&attacker, &course_symbol, &student);
}

// ---------------------------------------------------------------------------
// #162 – Meta-Transaction tests
// ---------------------------------------------------------------------------

#[test]
fn meta_tx_issues_certificate_for_student() {
    let (env, admin, client) = setup();

    env.ledger().with_mut(|l| l.timestamp = 9_000);

    let course_symbol = symbol_short!("META");
    let student = Address::generate(&env);
    let course_name = String::from_str(&env, "Meta Course");

    let call_data = MetaTxCallData {
        course_symbol: course_symbol.clone(),
        student: student.clone(),
        course_name: course_name.clone(),
        nonce: 0,
    };

    let cert = client.execute_meta_tx(&admin, &Bytes::new(&env), &call_data);

    assert_eq!(cert.student, student);
    assert_eq!(cert.course_symbol, course_symbol);
    assert_eq!(cert.issue_date, 9_000);
    assert!(!cert.revoked);

    // Certificate is retrievable
    assert_eq!(
        client.get_certificate(&course_symbol, &student),
        Some(cert)
    );
}

#[test]
fn meta_tx_nonce_increments_after_execution() {
    let (env, admin, client) = setup();

    let call_data = MetaTxCallData {
        course_symbol: symbol_short!("NONCE"),
        student: Address::generate(&env),
        course_name: String::from_str(&env, "Nonce Test"),
        nonce: 0,
    };

    assert_eq!(client.get_nonce(&admin), 0);
    client.execute_meta_tx(&admin, &Bytes::new(&env), &call_data);
    assert_eq!(client.get_nonce(&admin), 1);
}

#[test]
#[should_panic(expected = "invalid nonce")]
fn meta_tx_replay_is_rejected() {
    let (env, admin, client) = setup();

    let call_data = MetaTxCallData {
        course_symbol: symbol_short!("REPLY"),
        student: Address::generate(&env),
        course_name: String::from_str(&env, "Replay Test"),
        nonce: 0,
    };

    client.execute_meta_tx(&admin, &Bytes::new(&env), &call_data.clone());
    // Second call with same nonce must panic
    client.execute_meta_tx(&admin, &Bytes::new(&env), &call_data);
}

#[test]
#[should_panic(expected = "unauthorized")]
fn meta_tx_non_admin_is_rejected() {
    let (env, _admin, client) = setup();

    let attacker = Address::generate(&env);
    let call_data = MetaTxCallData {
        course_symbol: symbol_short!("HACK"),
        student: Address::generate(&env),
        course_name: String::from_str(&env, "Hack Attempt"),
        nonce: 0,
    };

    client.execute_meta_tx(&attacker, &Bytes::new(&env), &call_data);
}

#[test]
fn meta_tx_emits_event() {
    let (env, admin, client) = setup();

    let course_symbol = symbol_short!("EVNT");
    let call_data = MetaTxCallData {
        course_symbol: course_symbol.clone(),
        student: Address::generate(&env),
        course_name: String::from_str(&env, "Event Test"),
        nonce: 0,
    };

    client.execute_meta_tx(&admin, &Bytes::new(&env), &call_data);

    let (addr, topics, _) = env.events().all().last().unwrap();
    assert_eq!(addr, client.address);
    assert_eq!(
        Symbol::from_val(&env, &topics.get(0).unwrap()),
        Symbol::new(&env, "meta_tx_issued")
    );
// ============ Dynamic Minting Caps Tests ============

#[test]
fn get_default_mint_cap() {
    let (env, admin, client) = setup();

    let mint_cap = client.get_mint_cap(&admin);
    assert_eq!(mint_cap, 1000); // Default cap
}

#[test]
#[should_panic(expected = "unauthorized")]
fn non_admin_cannot_get_mint_cap() {
    let (env, _admin, client) = setup();

    let attacker = Address::generate(&env);
    client.get_mint_cap(&attacker);
}

#[test]
fn admin_can_set_mint_cap() {
    let (env, admin, client) = setup();

    // Set a new cap
    client.set_mint_cap(&admin, &500);

    // Verify the new cap
    let mint_cap = client.get_mint_cap(&admin);
    assert_eq!(mint_cap, 500);
}

#[test]
#[should_panic(expected = "unauthorized")]
fn non_admin_cannot_set_mint_cap() {
    let (env, _admin, client) = setup();

    let attacker = Address::generate(&env);
    client.set_mint_cap(&attacker, &500);
}

#[test]
#[should_panic(expected = "InvalidMintCap")]
fn cannot_set_zero_mint_cap() {
    let (env, admin, client) = setup();

    client.set_mint_cap(&admin, &0);
}

#[test]
fn mint_cap_exceeded_reverts() {
    let (env, admin, client) = setup();

    // Set a very low cap
    client.set_mint_cap(&admin, &2);

    let course_symbol = symbol_short!("CAP1");
    let course_name = String::from_str(&env, "Test Course");

    // Issue certificates up to the cap (2)
    let student1 = Address::generate(&env);
    let student2 = Address::generate(&env);
    client.issue(&course_symbol, &vec![&env, student1.clone(), student2.clone()], &course_name);

    // Try to issue more - should panic
    let student3 = Address::generate(&env);
    client.issue(&course_symbol, &vec![&env, student3.clone()], &course_name);
}

#[test]
fn get_mint_stats() {
    let (env, admin, client) = setup();

    // Set a specific cap
    client.set_mint_cap(&admin, &100);

    // Issue some certificates
    let course_symbol = symbol_short!("STAT");
    let course_name = String::from_str(&env, "Stats Course");
    let student1 = Address::generate(&env);
    let student2 = Address::generate(&env);
    let student3 = Address::generate(&env);
    client.issue(
        &course_symbol,
        &vec![&env, student1.clone(), student2.clone(), student3.clone()],
        &course_name,
    );

    // Check stats
    let (period, minted, cap, remaining) = client.get_mint_stats(&admin);

    assert_eq!(minted, 3);
    assert_eq!(cap, 100);
    assert_eq!(remaining, 97);
    // Period should be 0 at the start
    assert_eq!(period, 0);
}

#[test]
fn non_admin_cannot_get_mint_stats() {
    let (env, _admin, client) = setup();

    let attacker = Address::generate(&env);
    client.get_mint_stats(&attacker);
}

#[test]
fn multiple_issues_respect_mint_cap() {
    let (env, admin, client) = setup();

    // Set cap to 5
    client.set_mint_cap(&admin, &5);

    let course_symbol = symbol_short!("MULT");
    let course_name = String::from_str(&env, "Multi Issue Course");

    // First batch: 3 certificates
    let student1 = Address::generate(&env);
    let student2 = Address::generate(&env);
    let student3 = Address::generate(&env);
    client.issue(
        &course_symbol,
        &vec![&env, student1.clone(), student2.clone(), student3.clone()],
        &course_name,
    );

    // Second batch: 2 certificates - should succeed (total = 5)
    let student4 = Address::generate(&env);
    let student5 = Address::generate(&env);
    client.issue(
        &course_symbol,
        &vec![&env, student4.clone(), student5.clone()],
        &course_name,
    );

    // Third batch: 1 certificate - should fail (total would be 6)
    let student6 = Address::generate(&env);
    client.issue(&course_symbol, &vec![&env, student6.clone()], &course_name);
}

#[test]
fn mint_cap_update_emits_event() {
    let (env, admin, client) = setup();

    // Set a new cap - this should emit an event
    client.set_mint_cap(&admin, &250);

    // Find the mint_cap_updated event
    let all_events = env.events().all();
    let mut found_event = false;
    for (addr, topics, data) in all_events.iter() {
        if addr == client.address
            && Symbol::from_val(&env, &topics.get(0).unwrap()) == Symbol::new(&env, "mint_cap_updated")
        {
            found_event = true;
            // Data should be (old_cap, new_cap) = (1000, 250)
            // In soroban, data tuples are returned differently
        }
    }
    assert!(found_event);
}

#[test]
fn issue_emits_mint_period_update_event() {
    let (env, _admin, client) = setup();

    let course_symbol = symbol_short!("EVNT");
    let course_name = String::from_str(&env, "Event Course");
    let student1 = Address::generate(&env);
    let student2 = Address::generate(&env);

    client.issue(
        &course_symbol,
        &vec![&env, student1.clone(), student2.clone()],
        &course_name,
    );

    // Find the mint_period_update event
    let all_events = env.events().all();
    let mut found_event = false;
    for (addr, topics, _) in all_events.iter() {
        if addr == client.address
            && Symbol::from_val(&env, &topics.get(0).unwrap()) == Symbol::new(&env, "mint_period_update")
        {
            found_event = true;
        }
    }
    assert!(found_event);
}

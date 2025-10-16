#[test_only]
module journal::journal_tests {
    use std::string;
    use sui::test_scenario::Self;
    use sui::clock::Self;
    use journal::journal::{Self, Journal};

    const OWNER: address = @0x1;
    const NON_OWNER: address = @0x2;

    #[test]
    fun test_create_journal() {
        let mut scenario = test_scenario::begin(OWNER);
        let ctx = scenario.ctx();

        // Create a new journal
        let journal = journal::new_journal(string::utf8(b"My Test Journal"), ctx);
        
        // Verify journal properties
        assert!(journal::owner(&journal) == OWNER, 0);
        assert!(journal::title(&journal) == string::utf8(b"My Test Journal"), 1);
        assert!(journal::entry_count(&journal) == 0, 2);

        // Transfer to scenario
        transfer::public_transfer(journal, OWNER);
        scenario.end();
    }

    #[test]
    fun test_add_entry() {
        let mut scenario = test_scenario::begin(OWNER);
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);

        // Create journal
        let mut journal = journal::new_journal(string::utf8(b"My Test Journal"), ctx);

        // Add entry
        journal::add_entry(&mut journal, string::utf8(b"First entry"), &clock, ctx);
        
        // Verify entry was added
        assert!(journal::entry_count(&journal) == 1, 0);
        
        // Get and verify entry content using public getter
        let entry_content = journal::get_entry_content(&journal, 0);
        assert!(entry_content == string::utf8(b"First entry"), 1);

        // Clean up clock
        clock::destroy_for_testing(clock);
        transfer::public_transfer(journal, OWNER);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 0)]
    fun test_add_entry_non_owner() {
        let mut scenario = test_scenario::begin(OWNER);
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);

        // Create journal as OWNER
        let journal = journal::new_journal(string::utf8(b"My Test Journal"), ctx);
        transfer::public_transfer(journal, OWNER);

        // Try to add entry as NON_OWNER
        scenario.next_tx(NON_OWNER);
        let mut journal = scenario.take_from_address<Journal>(OWNER);
        let ctx = scenario.ctx();
        
        journal::add_entry(&mut journal, string::utf8(b"Unauthorized entry"), &clock, ctx);
        
        // Clean up clock
        clock::destroy_for_testing(clock);
        transfer::public_transfer(journal, NON_OWNER);
        scenario.end();
    }

    #[test]
    fun test_multiple_entries() {
        let mut scenario = test_scenario::begin(OWNER);
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);

        // Create journal
        let mut journal = journal::new_journal(string::utf8(b"My Test Journal"), ctx);

        // Add multiple entries
        journal::add_entry(&mut journal, string::utf8(b"Entry 1"), &clock, ctx);
        journal::add_entry(&mut journal, string::utf8(b"Entry 2"), &clock, ctx);
        journal::add_entry(&mut journal, string::utf8(b"Entry 3"), &clock, ctx);

        // Verify all entries
        assert!(journal::entry_count(&journal) == 3, 0);
        assert!(journal::get_entry_content(&journal, 0) == string::utf8(b"Entry 1"), 1);
        assert!(journal::get_entry_content(&journal, 1) == string::utf8(b"Entry 2"), 2);
        assert!(journal::get_entry_content(&journal, 2) == string::utf8(b"Entry 3"), 3);

        // Clean up clock
        clock::destroy_for_testing(clock);
        transfer::public_transfer(journal, OWNER);
        scenario.end();
    }
}

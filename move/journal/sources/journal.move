module journal::journal {
    use std::string::String;
    use sui::clock::{Self, Clock};

    /// An owned Sui object representing a journal
    public struct Journal has key, store {
        id: UID,
        owner: address,
        title: String,
        entries: vector<Entry>
    }

    /// A struct representing a journal entry, to be stored in the Journal object
    public struct Entry has store, copy, drop {
        content: String,
        create_at_ms: u64
    }

    /// Create and return a new Journal object with an empty entries vector
    public fun new_journal(title: String, ctx: &mut TxContext): Journal {
        Journal {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            title,
            entries: vector::empty<Entry>()
        }
    }

    /// Add a new entry to the journal
    /// Verifies the caller is the journal owner
    /// Creates a new Entry with the content and current timestamp from the clock
    /// Adds the entry to the journal's entries vector
    public fun add_entry(journal: &mut Journal, content: String, clock: &Clock, ctx: &TxContext) {
        assert!(journal.owner == tx_context::sender(ctx), 0);
        
        let entry = Entry {
            content,
            create_at_ms: clock::timestamp_ms(clock)
        };
        
        vector::push_back(&mut journal.entries, entry);
    }

    /// Get the owner of the journal
    public fun owner(journal: &Journal): address {
        journal.owner
    }

    /// Get the title of the journal
    public fun title(journal: &Journal): String {
        journal.title
    }

    /// Get the number of entries in the journal
    public fun entry_count(journal: &Journal): u64 {
        vector::length(&journal.entries)
    }

    /// Get an entry at a specific index
    public fun get_entry(journal: &Journal, index: u64): Entry {
        *vector::borrow(&journal.entries, index)
    }

    /// Get the content of an entry at a specific index
    public fun get_entry_content(journal: &Journal, index: u64): String {
        let entry = *vector::borrow(&journal.entries, index);
        entry.content
    }
}
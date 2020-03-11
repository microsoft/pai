require "pg"
require "securerandom"
require "helper"
require "fluent/test/driver/output"
require "fluent/test/helpers"

class PgJsonOutputTest < Test::Unit::TestCase
  include Fluent::Test::Helpers

  HOST = "localhost"
  PORT = 5432
  DATABASE = "pgjsontest"
  TABLE = "test_fluentd_#{SecureRandom.hex}"
  USER = "fluentd"
  PASSWORD = "fluentd"

  TIME_COL = "time"
  TAG_COL = "tag"
  RECORD_COL = "record"
  ENCODER = Yajl

  CONFIG = %[
    @type pgjson
    host #{HOST}
    port #{PORT}
    database #{DATABASE}
    table #{TABLE}
    user #{USER}
    password #{PASSWORD}
    time_col #{TIME_COL}
    tag_col #{TAG_COL}
    record_col #{RECORD_COL}
  ]

  def setup
    Fluent::Test.setup
  end

  def create_driver(conf = CONFIG)
    Fluent::Test::Driver::Output.new(Fluent::Plugin::PgJsonOutput).configure(conf)
  end

  def test_configure
    d = create_driver

    assert_equal HOST, d.instance.host
    assert_equal PORT, d.instance.port
    assert_equal DATABASE, d.instance.database
    assert_equal TABLE, d.instance.table
    assert_equal USER, d.instance.user
    assert_equal PASSWORD, d.instance.password
    assert_equal TIME_COL, d.instance.time_col
    assert_equal TAG_COL, d.instance.tag_col
    assert_equal RECORD_COL, d.instance.record_col
    assert_equal ENCODER, d.instance.encoder
  end

  def test_invalid_chunk_keys
    assert_raise_message(/'tag' in chunk_keys is required./) do
      create_driver(Fluent::Config::Element.new(
                      "ROOT", "", {
                        "@type" => "pgjson",
                        "host" => "#{HOST}",
                        "port" => "#{PORT}",
                        "database" => "#{DATABASE}",
                        "table" => "#{TABLE}",
                        "user" => "#{USER}",
                        "password" => "#{PASSWORD}",
                        "time_col" => "#{TIME_COL}",
                        "tag_col" => "#{TAG_COL}",
                        "record_col" => "#{RECORD_COL}",
                      }, [
                        Fluent::Config::Element.new("buffer", "mykey", {
                                                      "chunk_keys" => "mykey"
                                                    }, [])
                      ]))
    end
  end

  def test_write
    with_connection do |conn|
      tag = "test"
      time = event_time("2014-12-26 07:58:37 UTC")
      record = {"a"=>1}

      d = create_driver(CONFIG)
      d.run(default_tag: tag) do
        d.feed(time, record)
      end
      wait_for_data(conn)

      res = conn.exec("select * from #{TABLE}")[0]
      assert_equal res[TAG_COL], tag
      assert_equal event_time(res[TIME_COL]), time
      assert_equal res[RECORD_COL], record.to_json
    end
  end

  def test_escape_of_backslash
    with_connection do |conn|
      tag = "test"
      time = event_time("2014-12-26 07:58:37 UTC")
      record = {"a"=>"\"foo\""}

      d = create_driver(CONFIG)
      d.run(default_tag: tag) do
        d.feed(time, record)
      end
      wait_for_data(conn)

      res = conn.exec("select * from #{TABLE}")[0]
      assert_equal res[TAG_COL], tag
      assert_equal event_time(res[TIME_COL]), time
      assert_equal res[RECORD_COL], record.to_json
    end
  end

  def test_invalid_json
    with_connection do |conn|
      tag = "test"
      time = event_time("2014-12-26 07:58:37 UTC")

      d = create_driver(CONFIG)
      instance = d.instance
      def instance.record_value(record)
        "invalid json"
      end

      assert_raise RuntimeError do
        d.run(default_tag: tag) do
          d.feed(time, {})
        end
      end
    end
  end


  def ensure_connection
    conn = nil

    assert_nothing_raised do
      conn = PG::Connection.new(dbname: DATABASE, host: HOST, port: PORT, user: USER, password: PASSWORD)
    end

    conn
  end

  def create_test_table(conn)
    conn.exec(<<-SQL)
      CREATE TABLE #{TABLE} (
          #{TAG_COL} Text
          ,#{TIME_COL} Timestamptz
          ,#{RECORD_COL} Json
      );
    SQL
  end

  def drop_test_table(conn)
    conn.exec("DROP TABLE #{TABLE}")
  end

  def with_connection(&block)
    conn = ensure_connection
    create_test_table(conn)
    begin
      block.call(conn)
    ensure
      drop_test_table(conn)
      conn.close
    end
  end

  def wait_for_data(conn)
    10.times do
      res = conn.exec "select count(*) from #{TABLE}"
      return if res.getvalue(0,0).to_i > 0
      sleep 0.5
    end
    raise "COPY has not been finished correctly"
  end

end

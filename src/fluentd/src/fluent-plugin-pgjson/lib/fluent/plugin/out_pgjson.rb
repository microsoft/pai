# Copyright (c) 2012 OKUNO Akihiro
# Portions Copyright (c) Microsoft Corporation
#
# Apache License, Version 2.0

require "fluent/plugin/output"
require "pg"
require "yajl"
require "json"

module Fluent::Plugin
  class PgJsonOutput < Fluent::Plugin::Output
    Fluent::Plugin.register_output("pgjson", self)

    helpers :compat_parameters

    DEFAULT_BUFFER_TYPE = "memory"

    desc "The hostname of PostgreSQL server"
    config_param :host, :string, default: "localhost"
    desc "The port of PostgreSQL server"
    config_param :port, :integer, default: 5432
    desc "Set the sslmode to enable Eavesdropping protection/MITM protection"
    config_param :sslmode, :enum, list: %i[disable allow prefer require verify-ca verify-full], default: :prefer
    desc "The database name to connect"
    config_param :database, :string
    desc "The table name to insert records"
    config_param :table, :string
    desc "The user name to connect database"
    config_param :user, :string, default: nil
    desc "The password to connect database"
    config_param :password, :string, default: nil, secret: true
    desc "The column name for the time"
    config_param :time_col, :string, default: "time"
    desc "The column name for the tag"
    config_param :tag_col, :string, default: "tag"
    desc "The column name for the record"
    config_param :record_col, :string, default: "record"
    desc "If true, insert records formatted as msgpack"
    config_param :msgpack, :bool, default: false
    desc "JSON encoder (yajl/json)"
    config_param :encoder, :enum, list: [:yajl, :json], default: :yajl

    config_param :time_format, :string, default: "%F %T.%N %z"

    config_section :buffer do
      config_set_default :@type, DEFAULT_BUFFER_TYPE
      config_set_default :chunk_keys, ["tag"]
    end

    def initialize
      super
      @last_reset_ts = 0
    end

    def configure(conf)
      compat_parameters_convert(conf, :buffer)
      super
      unless @chunk_key_tag
        raise Fluent::ConfigError, "'tag' in chunk_keys is required."
      end
      @encoder = case @encoder
                 when :yajl
                   Yajl
                 when :json
                   JSON
                 end
    end

    def init_connection
      # This function is used to create a connection.
      begin
        log.info "[pgjson] [init_connection] Connecting to PostgreSQL server #{@host}:#{@port}, database #{@database}..."
        conn = PG::Connection.new(dbname: @database, host: @host, port: @port, sslmode: @sslmode, user: @user, password: @password)
      rescue PG::Error
        log.info "[pgjson] [init_connection] Failed to initialize a connection."
        if ! conn.nil?
          conn.close()
          conn = nil
        end
      rescue => err
        log.info "#{err}"
      end
      conn
    end

    def timestamp
       Time.now.getutc.to_i
     end

    def formatted_to_msgpack_binary
      true
    end

    def multi_workers_ready?
      true
    end

    def format(tag, time, record)
      [Time.at(time).strftime(@time_format), record].to_msgpack
    end

    def write(chunk)
      log.info "[pgjson] in write, chunk id #{dump_unique_id_hex chunk.unique_id}"
      thread = Thread.current
      if thread.key?(:conn)
        conn = thread[:conn]
      else
        conn = init_connection
        thread[:conn] = conn
      end
      if ! conn.nil?
        begin
          conn.exec("COPY #{@table} (#{@tag_col}, #{@time_col}, #{@record_col}) FROM STDIN WITH DELIMITER E'\\x01'")
          tag = chunk.metadata.tag
          chunk.msgpack_each do |time, record|
            conn.put_copy_data "#{tag}\x01#{time}\x01#{record_value(record, conn)}\n"
          end
        rescue PG::ConnectionBad, PG::UnableToSend => err
          # connection error
          conn = init_connection # try to reset broken connection, and wait for next retry
          thread[:conn] = conn
          log.info "%s while copy data: %s" % [ err.class.name, err.message ]
          retry
        rescue PG::Error => err
          log.info "[pgjson] [write] Error while writing, error is #{err.class}"
          errmsg = "%s while copy data: %s" % [ err.class.name, err.message ]
          conn.put_copy_end( errmsg )
          conn.get_result
          raise errmsg
        else
          conn.put_copy_end
          res = conn.get_result
          raise res.result_error_message if res.result_status != PG::PGRES_COMMAND_OK
          log.info "[pgjson] write successfully, chunk id #{dump_unique_id_hex chunk.unique_id}"
        end
      else
        raise "Cannot connect to db host."
      end
    end

    def record_value(record, conn)
      if @msgpack
        "\\#{conn.escape_bytea(record.to_msgpack)}"
      else
        json = @encoder.dump(record)
        json.gsub!(/\\/){ '\\\\' }
        json
      end
    end
  end
end

# Copyright (c) 2012 OKUNO Akihiro
# Portions Copyright (c) Microsoft Corporation
#
# Apache License, Version 2.0

require "fluent/plugin/output"
require "pg"
require "yajl"
require "json"
require 'digest'

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
    desc "The user name to connect database"
    config_param :user, :string, default: nil
    desc "The password to connect database"
    config_param :password, :string, default: nil, secret: true
    desc "The column name for the insertedAt"
    config_param :insertedAt_col, :string, default: "insertedAt"
    desc "The column name for the updatedAt"
    config_param :updatedAt_col, :string, default: "updatedAt"
    desc "The column name for the uid"
    config_param :uid_col, :string, default: "uid"
    desc "The column name for the frameworkName"
    config_param :frameworkName_col, :string, default: "frameworkName"
    desc "The column name for the attemptIndex"
    config_param :attemptIndex_col, :string, default: "attemptIndex"
    desc "The column name for the historyType"
    config_param :historyType_col, :string, default: "historyType"
    desc "The column name for the taskroleName"
    config_param :taskroleName_col, :string, default: "taskroleName"
    desc "The column name for the taskroleIndex"
    config_param :taskroleIndex_col, :string, default: "taskroleIndex"
    desc "The column name for the taskAttemptIndex"
    config_param :taskAttemptIndex_col, :string, default: "taskAttemptIndex"
    desc "The column name for the snapshot"
    config_param :snapshot_col, :string, default: "snapshot"
    desc "If true, insert records formatted as msgpack"
    config_param :msgpack, :bool, default: false
    desc "JSON encoder (yajl/json)"
    config_param :encoder, :enum, list: [:yajl, :json], default: :yajl

    config_param :time_format, :string, default: "%F %T.%N %z"

    config_param :reset_connection_interval, :integer, default: 5
    desc "Control the reset connection interval to be greater than 5 seconds globally"

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
      thread = Thread.current
      begin
        log.debug "[pgjson] [init_connection] Connecting to PostgreSQL server #{@host}:#{@port}, database #{@database}..."
        thread[:conn] = PG::Connection.new(dbname: @database, host: @host, port: @port, sslmode: @sslmode, user: @user, password: @password)
      rescue PG::Error
        log.debug "[pgjson] [init_connection] Failed to initialize a connection."
        if ! thread[:conn].nil?
          thread[:conn].close()
          thread[:conn] = nil
        end
      rescue => err
        log.debug "#{err}"
      end
    end

    def reset_connection	
      # This function try to fix the broken connection to database.	
      # if conn == nil, call init_connection	
      # if conn != nil, call conn.reset
      thread = Thread.current
      begin	
        if timestamp - @last_reset_ts > @reset_connection_interval	
          if thread[:conn].nil?	
            log.debug "[pgjson] [reset_connection] Call init_connection."	
            init_connection	
          else	
            log.debug "[pgjson] [reset_connection] Reset Connection."	
            thread[:conn].reset	
          end	
        else	
          log.debug "[pgjson] [reset_connection] Skip reset."	
        end	
      rescue => err	
        log.debug "[pgjson] [reset_connection] #{err.class}, #{err.message}"	
      ensure	
        @last_reset_ts = timestamp	
      end
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
      log.debug "[pgjson] in write, chunk id #{dump_unique_id_hex chunk.unique_id}"
      thread = Thread.current
      if ! thread.key?(:conn)
        init_connection
      end
      if ! thread[:conn].nil?
        begin
          chunk.msgpack_each do |time, record|
            kind = record["objectSnapshot"]["kind"]
            log.debug "log type: #{kind}"
            if kind == "Framework"
              thread[:conn].exec("COPY framework_history (\"#{@insertedAt_col}\", \"#{@updatedAt_col}\", \"#{@uid_col}\", \"#{@frameworkName_col}\", \"#{@attemptIndex_col}\", \"#{@historyType_col}\", \"#{@snapshot_col}\") FROM STDIN WITH DELIMITER E'\\x01'")
              frameworkName = record["objectSnapshot"]["metadata"]["name"]
              attemptIndex = record["objectSnapshot"]["status"]["attemptStatus"]["id"]
              historyType = "retry"
              snapshot = record_value(record["objectSnapshot"])
              # use frameworkName + attemptIndex + historyType to generate a uid
              uid = Digest::MD5.hexdigest "#{frameworkName}+#{attemptIndex}+#{historyType}"
              thread[:conn].put_copy_data "#{time}\x01#{time}\x01#{uid}\x01#{frameworkName}\x01#{attemptIndex}\x01#{historyType}\x01#{snapshot}\n"
            elsif kind == "Pod"
              thread[:conn].exec("COPY pods (\"#{@insertedAt_col}\", \"#{@updatedAt_col}\", \"#{@uid_col}\", \"#{@frameworkName_col}\", \"#{@attemptIndex_col}\", \"#{@taskroleName_col}\", \"#{@taskroleIndex_col}\", \"#{@taskAttemptIndex_col}\", \"#{@snapshot_col}\") FROM STDIN WITH DELIMITER E'\\x01'")
              uid = record["objectSnapshot"]["metadata"]["uid"]
              frameworkName = record["objectSnapshot"]["metadata"]["name"][0..31]
              attemptIndex = record["objectSnapshot"]["metadata"]["annotations"]["FC_FRAMEWORK_ATTEMPT_ID"]
              taskroleName = record["objectSnapshot"]["metadata"]["annotations"]["FC_TASKROLE_NAME"]
              taskroleIndex = record["objectSnapshot"]["metadata"]["annotations"]["FC_TASK_INDEX"]
              taskAttemptIndex = record["objectSnapshot"]["metadata"]["annotations"]["FC_TASK_ATTEMPT_ID"]
              snapshot = record_value(record["objectSnapshot"])
              thread[:conn].put_copy_data "#{time}\x01#{time}\x01#{uid}\x01#{frameworkName}\x01#{attemptIndex}\x01#{taskroleName}\x01#{taskroleIndex}\x01#{taskAttemptIndex}\x01#{snapshot}\n"
            end
          end
        rescue PG::ConnectionBad, PG::UnableToSend => err
          # connection error
          reset_connection # try to reset broken connection, and wait for next retry
          log.debug "%s while copy data: %s" % [ err.class.name, err.message ]
          retry
        rescue PG::Error => err
          log.debug "[pgjson] [write] Error while writing, error is #{err.class}"
          errmsg = "%s while copy data: %s" % [ err.class.name, err.message ]
          thread[:conn].put_copy_end( errmsg )
          thread[:conn].get_result
          raise errmsg
        else
          thread[:conn].put_copy_end
          res = thread[:conn].get_result
          raise res.result_error_message if res.result_status != PG::PGRES_COMMAND_OK
          log.debug "[pgjson] write successfully, chunk id #{dump_unique_id_hex chunk.unique_id}"
        end
      else
        raise "Cannot connect to db host."
      end
    end

    def record_value(record)
      thread = Thread.current
      if @msgpack
        "\\#{thread[:conn].escape_bytea(record.to_msgpack)}"
      else
        json = @encoder.dump(record)
        json.gsub!(/\\/){ '\\\\' }
        json
      end
    end
  end
end

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

    def insert_framework(hex_id, time, record)
      # This function try to insert the framework snapshot into framework history table.
      # In some cases, the framework controller may have duplicate logs about one framework attempt,
      # or there has been already successful inserted record before.
      # To handle it, `insert_framework` executes a "SELECT" first.
      # If the uid exists in the table, it will ignore it safely.
      # Any error should be raised.
      thread = Thread.current
      frameworkName = record["objectSnapshot"]["metadata"]["name"]
      attemptIndex = record["objectSnapshot"]["status"]["attemptStatus"]["id"]
      historyType = "retry"
      snapshot = record_value(record["objectSnapshot"])
      # use frameworkName + attemptIndex + historyType to generate a uid
      uid = Digest::MD5.hexdigest "#{frameworkName}+#{attemptIndex}+#{historyType}"
      # select from framework_history, ensure there is no corresponding history object
      selectResult = thread[:conn].exec_params('SELECT uid from framework_history where uid=$1', [uid])
      if selectResult.cmd_tuples == 0
          # if there is no existing records, try to insert a new one.
          thread[:conn].exec_params("INSERT INTO framework_history (\"#{@insertedAt_col}\", \"#{@updatedAt_col}\", \"#{@uid_col}\", \"#{@frameworkName_col}\", \"#{@attemptIndex_col}\", \"#{@historyType_col}\", \"#{@snapshot_col}\") " +
            "VALUES ($1, $2, $3, $4, $5, $6, $7)", [time, time, uid, frameworkName, attemptIndex, historyType, snapshot]
          )
      else
        # if there is an existing record, ignore it.
        log.warn "[pgjson] chunk #{hex_id}: ignored framework snapshot object as it already exists, uid=#{uid}"
      end
    end

    def insert_task(hex_id, time, historyType, record)
      # This function try to insert the task snapshot into task history table.
      # In some cases, the framework controller may have duplicate logs about one task attempt,
      # or there has been already successful inserted record before.
      # To handle it, `insert_task` executes a "SELECT" first.
      # If the uid exists in the table, it will ignore it safely.
      # Any error should be raised.
      thread = Thread.current
      frameworkName = record["objectSnapshot"]["metadata"]["annotations"]["FC_FRAMEWORK_NAME"]
      attemptIndex = record["objectSnapshot"]["metadata"]["annotations"]["FC_FRAMEWORK_ATTEMPT_ID"]
      taskroleName = record["objectSnapshot"]["metadata"]["annotations"]["FC_TASKROLE_NAME"]
      taskName = record["objectSnapshot"]["metadata"]["name"]
      taskIndex = record["objectSnapshot"]["metadata"]["annotations"]["FC_TASK_INDEX"]
      taskUid = record["objectSnapshot"]["metadata"]["uid"]
      taskAttemptIndex = record["objectSnapshot"]["status"]["attemptStatus"]["id"]
      podUid = record["objectSnapshot"]["status"]["attemptStatus"]["podUID"]
      snapshot = record_value(record["objectSnapshot"])
      # use taskUid + taskAttemptIndex + historyType to generate a uid
      uid = Digest::MD5.hexdigest "#{taskUid}+#{taskAttemptIndex}+#{historyType}"
      # select from framework_history, ensure there is no corresponding history object
      selectResult = thread[:conn].exec_params('SELECT uid from task_history where uid=$1', [uid])
      if selectResult.cmd_tuples == 0
          # if there is no existing records, try to insert a new one.
          thread[:conn].exec_params("INSERT INTO task_history (\"#{@insertedAt_col}\", \"#{@updatedAt_col}\", \"#{@uid_col}\", \"#{@frameworkName_col}\", \"#{@attemptIndex_col}\", " + 
            "\"#{@taskroleName_col}\", \"taskName\", \"taskIndex\", \"taskUid\", \"#{@taskAttemptIndex_col}\", \"podUid\", \"#{@historyType_col}\", \"#{@snapshot_col}\") " +
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)", 
            [time, time, uid, frameworkName, attemptIndex, taskroleName, taskName, taskIndex, taskUid, taskAttemptIndex, podUid, historyType, snapshot]
          )
      else
        # if there is an existing record, ignore it.
        log.warn "[pgjson] chunk #{hex_id}: ignored task object as it already exists, uid=#{uid}"
      end
    end


    def insert_pod(hex_id, time, record)
      # This function try to insert the pod snapshot into pods table.
      # In some cases, the framework controller may have duplicate logs about one pod,
      # or there has been already successful inserted record before.
      # To handle it, `insert_pod` executes a "SELECT" first.
      # If the uid exists in the table, it will ignore it safely.
      # Any error should be raised.
      thread = Thread.current
      uid = record["objectSnapshot"]["metadata"]["uid"]
      frameworkName = record["objectSnapshot"]["metadata"]["name"][0..31]
      attemptIndex = record["objectSnapshot"]["metadata"]["annotations"]["FC_FRAMEWORK_ATTEMPT_ID"]
      taskroleName = record["objectSnapshot"]["metadata"]["annotations"]["FC_TASKROLE_NAME"]
      taskroleIndex = record["objectSnapshot"]["metadata"]["annotations"]["FC_TASK_INDEX"]
      taskAttemptIndex = record["objectSnapshot"]["metadata"]["annotations"]["FC_TASK_ATTEMPT_ID"]
      snapshot = record_value(record["objectSnapshot"])
      selectResult = thread[:conn].exec_params('SELECT uid from pods where uid=$1', [uid])
      if selectResult.cmd_tuples == 0
          # if there is no existing records, try to insert a new one.
          thread[:conn].exec("INSERT INTO pods (\"#{@insertedAt_col}\", \"#{@updatedAt_col}\", \"#{@uid_col}\", \"#{@frameworkName_col}\", \"#{@attemptIndex_col}\", \"#{@taskroleName_col}\", \"#{@taskroleIndex_col}\", \"#{@taskAttemptIndex_col}\", \"#{@snapshot_col}\") " + 
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [time, time, uid, frameworkName, attemptIndex, taskroleName, taskroleIndex, taskAttemptIndex, snapshot]
          )
      else
        # if there is an existing record, ignore it.
        log.warn "[pgjson] chunk #{hex_id}: ignored pod snapshot object as it already exists, uid=#{uid}"
      end
    end

    def write(chunk)
      hex_id = dump_unique_id_hex chunk.unique_id
      log.info "[pgjson] chunk #{hex_id} received"
      thread = Thread.current
      if ! thread.key?(:conn)
        init_connection
      end
      if ! thread[:conn].nil?
        begin
          chunk.msgpack_each do |time, record|
            kind = record["objectSnapshot"]["kind"]
            trigger = record['objectSnapshotTrigger']
            log.info "[pgjson] object type #{kind} triggered by #{trigger} found in chunk #{hex_id}"
            if trigger == "OnFrameworkRetry" && kind == "Framework"
              insert_framework hex_id, time, record
            elsif trigger == "OnTaskRetry" && kind == "Task"
              insert_task hex_id, time, "retry", record
            elsif trigger == "OnTaskDeletion" && kind == "Task"
              insert_task hex_id, time, "deletion", record
            elsif trigger == "OnPodDeletion" && kind == "Pod"
              insert_pod hex_id, time, record
            else
              logMessage = record['logMessage']
              log.info "[pgjson] object type #{kind} triggered by #{trigger} in chunk #{hex_id} ignored. log message: #{logMessage}"
            end
          end
        rescue PG::ConnectionBad, PG::UnableToSend => err
          # connection error
          reset_connection # try to reset broken connection, and wait for next retry
          log.warn "[pgjson] connection error happens for chunk #{hex_id}. message: #{err.message}"
          retry
        rescue PG::Error => err
          log.warn "[pgjson] PG::Error happens for chunk #{hex_id}. message: #{err.message}"
          errmsg = "error class %s happens, message: %s" % [ err.class.name, err.message ]
          raise errmsg
        else
          log.info "[pgjson] chunk #{hex_id} writes successfully"
        end
      else
        raise "Cannot connect to db host."
      end
    end

    def record_value(record)
      thread = Thread.current
      if @msgpack
        # dump record as msgpack
        "\\#{thread[:conn].escape_bytea(record.to_msgpack)}"
      else
        # dump record as string
        json = @encoder.dump(record)
        json
      end
    end
  end
end
